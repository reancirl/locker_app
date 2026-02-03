using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using PcLocker.Models;

namespace PcLocker
{
    public partial class MainWindow : Window
    {
        private AppSettings? _settings;
        private ApiClient? _apiClient;
        private readonly CancellationTokenSource _cts = new();
        private readonly DispatcherTimer _countdownTimer;
        private DateTimeOffset? _unlockedUntil;
        private int[] _warningThresholds = Array.Empty<int>();
        private readonly HashSet<int> _warningsFired = new();
        private bool _isLocked = true;
        private bool _allowClose;

        public MainWindow()
        {
            InitializeComponent();
            _countdownTimer = new DispatcherTimer(TimeSpan.FromSeconds(1), DispatcherPriority.Background, CountdownTick, Dispatcher);
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                _settings = AppSettings.Load();
                DeviceIdText.Text = $"Device: {_settings.DeviceId}";
                _apiClient = new ApiClient(_settings);
                StartPollingLoop();
            }
            catch (Exception ex)
            {
                StatusText.Text = "Configuration error: " + ex.Message;
                Logging.Write("Startup failed", ex);
            }
        }

        private void StartPollingLoop()
        {
            if (_apiClient == null || _settings == null) return;

            Task.Run(async () =>
            {
                while (!_cts.IsCancellationRequested)
                {
                    try
                    {
                        var state = await _apiClient.GetPcStateAsync(_settings.DeviceId, _cts.Token);
                        if (state != null)
                        {
                            Dispatcher.Invoke(() => ApplyState(state));
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        Logging.Write("Polling failed; locking for safety", ex);
                        Dispatcher.Invoke(() =>
                        {
                            StatusText.Text = "API unavailable. Locking for safety.";
                            TransitionToLocked(true);
                        });
                    }

                    try
                    {
                        await Task.Delay(TimeSpan.FromSeconds(_settings.PollSeconds), _cts.Token);
                    }
                    catch (TaskCanceledException)
                    {
                        break;
                    }
                }
            }, _cts.Token);
        }

        private void ApplyState(PcStateResponse state)
        {
            if (string.Equals(state.Mode, "unlocked", StringComparison.OrdinalIgnoreCase) && state.UnlockedUntil.HasValue)
            {
                var previousUntil = _unlockedUntil;
                _unlockedUntil = state.UnlockedUntil.Value;
                if (!previousUntil.HasValue || _unlockedUntil.Value != previousUntil.Value)
                {
                    _warningsFired.Clear();
                }
                var defaults = new[] { 300, 60 };
                _warningThresholds = (state.Warnings ?? defaults).OrderByDescending(x => x).ToArray();
                StatusText.Text = $"Unlocked until {_unlockedUntil:yyyy-MM-dd HH:mm:ss zzz}";
                TransitionToUnlocked();
            }
            else
            {
                StatusText.Text = "Locked";
                TransitionToLocked(true);
            }
        }

        private void TransitionToUnlocked()
        {
            _isLocked = false;
            Topmost = false;
            LockOverlay.Visibility = Visibility.Visible; // keep layout when showing again
            Hide();
            if (!_countdownTimer.IsEnabled)
            {
                _countdownTimer.Start();
            }
        }

        private void TransitionToLocked(bool enforceWorkstationLock)
        {
            var wasLocked = _isLocked;
            _isLocked = true;
            _unlockedUntil = null;
            _warningThresholds = Array.Empty<int>();
            _warningsFired.Clear();
            if (_countdownTimer.IsEnabled)
            {
                _countdownTimer.Stop();
            }

            if (enforceWorkstationLock && !wasLocked)
            {
                Task.Run(LockHelper.LockWorkstation);
            }

            Show();
            Topmost = true;
            LockOverlay.Visibility = Visibility.Visible;
            Activate();
            Focus();
        }

        private void CountdownTick(object? sender, EventArgs e)
        {
            if (!_unlockedUntil.HasValue)
            {
                _countdownTimer.Stop();
                return;
            }

            var remaining = _unlockedUntil.Value - DateTimeOffset.Now;
            if (remaining <= TimeSpan.Zero)
            {
                Logging.Write("Session expired; locking");
                StatusText.Text = "Session ended";
                TransitionToLocked(true);
                return;
            }

            var secondsLeft = (int)Math.Floor(remaining.TotalSeconds);
            foreach (var threshold in _warningThresholds)
            {
                if (secondsLeft <= threshold && !_warningsFired.Contains(threshold))
                {
                    _warningsFired.Add(threshold);
                    ShowWarning(secondsLeft);
                }
            }
        }

        private void ShowWarning(int secondsLeft)
        {
            var remaining = TimeSpan.FromSeconds(secondsLeft);
            var message = $"Time remaining: {remaining:hh\\:mm\\:ss}";
            MessageBox.Show(message, "PC Locker", MessageBoxButton.OK, MessageBoxImage.Warning, MessageBoxResult.OK, MessageBoxOptions.DefaultDesktopOnly);
        }


        private async Task TriggerImmediatePoll()
        {
            if (_apiClient == null || _settings == null) return;
            try
            {
                var state = await _apiClient.GetPcStateAsync(_settings.DeviceId, _cts.Token);
                if (state != null)
                {
                    ApplyState(state);
                }
            }
            catch (Exception ex)
            {
                Logging.Write("Immediate poll failed", ex);
            }
        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            if (_isLocked)
            {
                Topmost = true;
                Show();
                Activate();
                Focus();
            }
        }

        private void Window_Closing(object? sender, CancelEventArgs e)
        {
#if !DEBUG
            if (!_allowClose)
            {
                e.Cancel = true;
                return;
            }
#endif
            _cts.Cancel();
            _apiClient?.Dispose();
        }

        protected override void OnClosed(EventArgs e)
        {
            _cts.Cancel();
            _apiClient?.Dispose();
            base.OnClosed(e);
        }
    }
}
