#!/usr/bin/env bash
# Update Plus - Notification functions
# Version: 3.0.0
# Supports both moltbot and clawdbot

# Detect channel from target format
detect_channel() {
  local target="$1"

  if [[ "$target" == +* ]]; then
    echo "whatsapp"
  elif [[ "$target" == @* ]]; then
    echo "telegram"
  elif [[ "$target" == channel:* ]]; then
    echo "discord"
  else
    echo "whatsapp"  # Default
  fi
}

# Send notification via Clawdbot messaging
send_notification() {
  local status="$1"  # "success", "info", or "error"
  local details="${2:-}"

  # Check if notifications are enabled
  if [[ "$NOTIFY_ENABLED" != "true" ]] && [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  # Check notification type preference
  if [[ "$status" == "success" || "$status" == "info" ]] && [[ "$NOTIFY_ON_SUCCESS" != "true" ]]; then
    return 0
  fi
  if [[ "$status" == "error" ]] && [[ "$NOTIFY_ON_ERROR" != "true" ]]; then
    return 0
  fi

  # Check if target is configured
  if [[ -z "$NOTIFY_TARGET" ]]; then
    log_warning "Notification enabled but no target configured"
    return 0
  fi

  if [[ "$DRY_RUN" == true ]]; then
    log_dry_run "Would send notification to $NOTIFY_TARGET"
    return 0
  fi

  log_info "Sending notification..."

  # Check if bot command is available (moltbot or clawdbot)
  local notify_cmd=""
  if command_exists moltbot; then
    notify_cmd="moltbot"
  elif command_exists clawdbot; then
    notify_cmd="clawdbot"
  else
    log_warning "Neither moltbot nor clawdbot command found, skipping notification"
    return 0
  fi

  # Detect channel from target format
  local channel=$(detect_channel "$NOTIFY_TARGET")

  # Build message (use detected bot name)
  local bot_label=$(echo "$notify_cmd" | sed 's/.*/\u&/')  # Capitalize
  local message=""
  if [[ "$status" == "success" ]]; then
    message="✅ *${bot_label} Update Complete*"
    message+="\n\n📦 Updates applied successfully."
  elif [[ "$status" == "info" ]]; then
    message="ℹ️ *${bot_label} Update Check*"
    message+="\n\n📋 Everything is already up to date."
  else
    message="❌ *${bot_label} Update Failed*"
    message+="\n\n⚠️ An error occurred during the update."
  fi

  if [[ -n "$details" ]]; then
    message+="\n\n$details"
  fi

  message+="\n\n🕐 $(date '+%Y-%m-%d %H:%M:%S')"

  # Send via bot message command
  if $notify_cmd message send --channel "$channel" --target "$NOTIFY_TARGET" --message "$message" 2>/dev/null; then
    log_success "Notification sent to $NOTIFY_TARGET via $channel"
    log_to_file "Notification sent to $NOTIFY_TARGET via $channel"
  else
    log_warning "Could not send notification (check gateway status)"
    log_to_file "WARNING: Could not send notification"
  fi
}

# Force enable notifications for this run
enable_notifications() {
  NOTIFICATION_ENABLED="true"
}
