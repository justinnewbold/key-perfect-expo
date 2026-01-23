# Key Perfect - Comprehensive Testing Guide

## Overview
This guide covers testing procedures for all features in the Key Perfect music education app, including the three high-impact features: Offline Sync, Analytics Dashboard, and Live Events.

---

## Table of Contents
1. [Core Gameplay Testing](#core-gameplay-testing)
2. [Offline Sync Testing](#offline-sync-testing)
3. [Analytics Dashboard Testing](#analytics-dashboard-testing)
4. [Live Events Testing](#live-events-testing)
5. [Performance Testing](#performance-testing)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Accessibility Testing](#accessibility-testing)

---

## Core Gameplay Testing

### Level Progression
**Test Case 1.1: Level Unlocking**
- [ ] Start with Level 1 unlocked
- [ ] Complete Level 1 with 80% accuracy
- [ ] Verify Level 2 unlocks
- [ ] Verify XP is awarded correctly
- [ ] Check achievement unlock notification

**Test Case 1.2: Level Scoring**
- [ ] Complete a level
- [ ] Verify score is saved to AsyncStorage
- [ ] Return to Levels screen
- [ ] Confirm best score is displayed
- [ ] Replay level with lower score
- [ ] Verify best score remains unchanged

**Test Case 1.3: Adaptive Difficulty**
- [ ] Play Speed Mode
- [ ] Get 5 correct answers in a row
- [ ] Observe difficulty increasing (more options)
- [ ] Get 3 wrong answers
- [ ] Verify difficulty decreases

### Game Modes
**Test Case 2.1: Speed Mode**
- [ ] Start Speed Mode
- [ ] Verify 30-second timer starts
- [ ] Answer questions
- [ ] Verify timer counts down correctly
- [ ] Let timer reach 0
- [ ] Check score submission and leaderboard update

**Test Case 2.2: Survival Mode**
- [ ] Start Survival Mode
- [ ] Verify starting with 3 lives
- [ ] Answer incorrectly
- [ ] Verify life is lost
- [ ] Lose all lives
- [ ] Confirm game over screen appears

**Test Case 2.3: Daily Challenge**
- [ ] Complete daily challenge
- [ ] Verify it's marked as completed
- [ ] Restart app
- [ ] Confirm challenge remains completed
- [ ] Change device date to next day
- [ ] Verify new challenge appears

### Combo System
**Test Case 3.1: Combo Building**
- [ ] Answer 3 questions correctly
- [ ] Verify combo indicator appears
- [ ] Continue to 5 correct answers
- [ ] Check for combo message ("On Fire!")
- [ ] Verify XP multiplier is applied

**Test Case 3.2: Combo Breaking**
- [ ] Build a 5x combo
- [ ] Answer incorrectly
- [ ] Verify combo resets to 0
- [ ] Check that multiplier is removed

---

## Offline Sync Testing

### Basic Offline Functionality
**Test Case 4.1: Offline Practice**
- [ ] Enable airplane mode
- [ ] Play Speed Mode
- [ ] Complete game and submit score
- [ ] Verify score is saved locally
- [ ] Check that offline indicator appears
- [ ] Confirm "X items pending" message

**Test Case 4.2: Sync Queue Management**
- [ ] Perform 5 actions while offline:
  - [ ] Complete a level (high priority)
  - [ ] Unlock achievement (high priority)
  - [ ] Save settings (low priority)
  - [ ] Submit scores (high priority)
  - [ ] Record analytics (low priority)
- [ ] Verify all actions are queued
- [ ] Check queue order (high priority first)

**Test Case 4.3: Auto-Sync on Reconnect**
- [ ] Disable network
- [ ] Perform 3 actions
- [ ] Re-enable network
- [ ] Wait 5 seconds
- [ ] Verify sync starts automatically
- [ ] Check offline indicator shows "Syncing..."
- [ ] Confirm all items are processed
- [ ] Verify "Last sync: Just now" appears

### Retry Logic
**Test Case 4.4: Exponential Backoff**
- [ ] Mock a failing API endpoint
- [ ] Add item to sync queue
- [ ] Observe retry attempts
- [ ] Verify delays: 2s, 4s, 8s, 16s
- [ ] Check max retries respected (10 for high, 5 for medium, 3 for low)

**Test Case 4.5: Retry Failed Items**
- [ ] Create items that exceed max retries
- [ ] Verify they're marked as failed
- [ ] Tap "Retry Failed Items" button
- [ ] Confirm retry count is reset
- [ ] Verify items are re-queued

### Conflict Resolution
**Test Case 4.6: Score Conflict**
- [ ] Complete game with score 100 (offline)
- [ ] Simulate server has score 150
- [ ] Trigger sync
- [ ] Verify max score (150) is kept
- [ ] Check no data loss occurred

**Test Case 4.7: Stats Merging**
- [ ] Accumulate offline stats (XP, streak)
- [ ] Simulate server has different stats
- [ ] Sync data
- [ ] Verify stats are merged correctly (max values)
- [ ] Check totalAttempts and correctAnswers sum properly

**Test Case 4.8: Achievement Union**
- [ ] Unlock achievement A offline
- [ ] Simulate server has achievements B, C
- [ ] Sync data
- [ ] Verify all three achievements (A, B, C) are present
- [ ] No duplicates exist

### Cached Data
**Test Case 4.9: Cached Leaderboard**
- [ ] View leaderboard while online
- [ ] Go offline
- [ ] Navigate away and back to leaderboard
- [ ] Verify cached data is shown
- [ ] Check "Cached data" indicator appears
- [ ] Verify timestamp shows when it was cached

**Test Case 4.10: Cached Tournament**
- [ ] Load tournament while online
- [ ] Disable network
- [ ] View tournament details
- [ ] Confirm cached tournament is displayed
- [ ] Check countdown timer still works
- [ ] Verify participant list is visible

---

## Analytics Dashboard Testing

### Performance Trends
**Test Case 5.1: Trend Calculation**
- [ ] Complete 20 practice sessions over 2 weeks
- [ ] Navigate to Analytics screen
- [ ] Verify "Performance Trend" card displays
- [ ] Check accuracy change percentage
- [ ] Confirm trend (improving/stable/declining) is correct
- [ ] View data points graph

**Test Case 5.2: Period Selection**
- [ ] View analytics
- [ ] Switch between "Week", "Month", "All" views
- [ ] Verify data updates correctly
- [ ] Check date ranges are accurate

### Practice Patterns
**Test Case 5.3: Best Time Detection**
- [ ] Practice 5 sessions in morning (7-11 AM)
- [ ] Practice 3 sessions in evening (6-10 PM)
- [ ] Achieve higher accuracy in morning
- [ ] View Practice Patterns
- [ ] Verify "Best Time: Morning 🌅" is shown

**Test Case 5.4: Consistency Score**
- [ ] Practice daily for 7 days
- [ ] Check consistency score ≥ 70%
- [ ] Skip 3 days
- [ ] Verify consistency drops
- [ ] Get insight: "Practice More Regularly"

**Test Case 5.5: Session Length Recommendation**
- [ ] Complete 10 sessions of 15 minutes each
- [ ] View optimal session length
- [ ] Verify it shows "15min"
- [ ] Complete longer sessions (25min)
- [ ] Check if recommendation updates

### Skill Breakdown
**Test Case 5.6: Skill Tracking**
- [ ] Practice multiple modes: Speed, Intervals, Chords
- [ ] View Skill Breakdown section
- [ ] Verify each mode is listed
- [ ] Check accuracy percentages are correct
- [ ] Confirm percentile rankings appear
- [ ] Verify progress bars match accuracy

**Test Case 5.7: Improvement Areas**
- [ ] Have at least one skill below 80% accuracy
- [ ] View Analytics
- [ ] Check "Needs Work" section appears
- [ ] Verify low-performing skills are listed
- [ ] Confirm recommendations are shown

### Insights
**Test Case 5.8: Positive Insights**
- [ ] Improve accuracy by 10%+ in a week
- [ ] View Insights section
- [ ] Verify positive insight appears (green icon)
- [ ] Check message: "X% Improvement!"
- [ ] Confirm trend-up icon is shown

**Test Case 5.9: Suggestions**
- [ ] Have inconsistent practice (<40% consistency)
- [ ] View Insights
- [ ] Check for suggestion: "Practice More Regularly"
- [ ] Verify info icon is displayed
- [ ] Confirm actionable advice is given

**Test Case 5.10: Streak Insights**
- [ ] Build a 7-day streak
- [ ] View Insights
- [ ] Verify "7 Day Streak! 🔥" appears
- [ ] Get to 1-day streak
- [ ] Check for "Build Your Streak" suggestion

### Predictions
**Test Case 5.11: Next Level Prediction**
- [ ] Have consistent XP growth
- [ ] View Predictions section
- [ ] Verify "Next level by [date]" appears
- [ ] Check date is reasonable
- [ ] Complete more practice
- [ ] Verify prediction updates

**Test Case 5.12: Plateau Detection**
- [ ] Maintain same accuracy for 2 weeks
- [ ] View Predictions
- [ ] Check "Plateau detected" warning
- [ ] Verify suggestion: "try new modes!"

**Test Case 5.13: Streak Risk**
- [ ] Practice inconsistently
- [ ] View Predictions
- [ ] Verify "Streak risk: HIGH" appears in red
- [ ] Practice consistently for 5 days
- [ ] Check risk changes to "LOW" in green

### Goals
**Test Case 5.14: Goal Creation**
- [ ] Tap "Create Goal" button
- [ ] Set goal: "Reach 85% accuracy"
- [ ] Set target: 85
- [ ] Set deadline: 7 days from now
- [ ] Save goal
- [ ] Verify it appears in Goals section

**Test Case 5.15: Goal Progress**
- [ ] Create goal: "10 day streak"
- [ ] Practice daily
- [ ] View goal after each session
- [ ] Verify progress bar increases
- [ ] Check current/target numbers update
- [ ] Complete goal
- [ ] Confirm completion checkmark appears

**Test Case 5.16: Goal Deletion**
- [ ] Long-press on a goal
- [ ] Tap "Delete"
- [ ] Confirm deletion
- [ ] Verify goal is removed from list

### Weekly Reports
**Test Case 5.17: Report Generation**
- [ ] Practice for 7 days
- [ ] Generate weekly report
- [ ] Verify sessions count is correct
- [ ] Check XP earned total
- [ ] Confirm top skills are listed
- [ ] Verify "needs work" skills appear
- [ ] Check next goals suggestions

---

## Live Events Testing

### Event Calendar
**Test Case 6.1: Viewing Events**
- [ ] Navigate to Events Calendar
- [ ] Verify "Active Now" section shows current events
- [ ] Check "Coming Soon" shows upcoming events
- [ ] Confirm event cards display correctly:
  - [ ] Event type badge
  - [ ] Title and description
  - [ ] Countdown timer
  - [ ] Participant count
  - [ ] Rewards list
  - [ ] Entry fee (if premium)

**Test Case 6.2: Event Countdown**
- [ ] View upcoming event
- [ ] Observe countdown timer
- [ ] Verify it updates every second
- [ ] Check format: "Xd Xh Xm Xs"
- [ ] Wait for event to become active
- [ ] Verify status changes to "Active Now"
- [ ] Confirm "Starts in" changes to "Ends in"

**Test Case 6.3: Event Types**
- [ ] Verify Daily Rush events appear at correct times:
  - [ ] Morning Rush (7 AM)
  - [ ] Lunch Break (12 PM)
  - [ ] Happy Hour (6 PM)
  - [ ] Night Owl (10 PM)
- [ ] Check Weekend events:
  - [ ] Saturday Showdown
  - [ ] Sunday Marathon
- [ ] Confirm Theme Weeks rotate
- [ ] Verify Premium tournaments show entry fee

### Joining Events
**Test Case 6.4: Free Event Participation**
- [ ] Find active free event
- [ ] Tap "Join Now"
- [ ] Verify navigation to event screen
- [ ] Check participant count increases
- [ ] Play the event game mode
- [ ] Submit score
- [ ] Verify score appears on leaderboard

**Test Case 6.5: Premium Event Purchase**
- [ ] Find premium tournament ($4.99 entry)
- [ ] Tap "Join Now"
- [ ] Verify payment prompt appears
- [ ] Mock successful payment
- [ ] Confirm access granted
- [ ] Check entry fee is recorded

**Test Case 6.6: Event Restrictions**
- [ ] Try joining ended event
- [ ] Verify error message
- [ ] Try joining event at max capacity
- [ ] Confirm "Full" message appears
- [ ] Try joining without payment (premium)
- [ ] Check payment required message

### Event Leaderboards
**Test Case 6.7: Live Rankings**
- [ ] Join active event
- [ ] Submit initial score (e.g., 100)
- [ ] View event leaderboard
- [ ] Verify your rank appears
- [ ] Submit higher score (e.g., 150)
- [ ] Check rank updates
- [ ] Verify score replaced (not added)

**Test Case 6.8: Leaderboard Updates**
- [ ] View event leaderboard
- [ ] Wait for other participants to join
- [ ] Pull to refresh
- [ ] Verify participant count updates
- [ ] Check new scores appear
- [ ] Confirm rankings are sorted correctly

### Event Rewards
**Test Case 6.9: Reward Display**
- [ ] View event details
- [ ] Check rewards section shows:
  - [ ] XP amounts
  - [ ] Badge icons
  - [ ] Pack descriptions
  - [ ] Cash prizes (premium)
- [ ] Verify reward requirements (top 10, etc.)

**Test Case 6.10: Claiming Rewards**
- [ ] Complete event in top 10
- [ ] Wait for event to end
- [ ] Navigate to completed events
- [ ] Tap "Claim Rewards"
- [ ] Verify rewards are granted:
  - [ ] XP added to total
  - [ ] Badge unlocked
  - [ ] Pack added to inventory
- [ ] Check "Claimed" status appears
- [ ] Try claiming again
- [ ] Verify error: "Already claimed"

### Event Notifications
**Test Case 6.11: Event Reminders**
- [ ] Enable notifications
- [ ] Set up event starting in 15 minutes
- [ ] Wait for reminder
- [ ] Verify notification appears
- [ ] Check notification content:
  - [ ] Event title
  - [ ] "Starting in 15 minutes"
  - [ ] Tap to join

**Test Case 6.12: Event Start Notifications**
- [ ] Subscribe to event
- [ ] Wait for event to start
- [ ] Verify notification: "Event now live!"
- [ ] Tap notification
- [ ] Confirm direct navigation to event

---

## Performance Testing

### Load Testing
**Test Case 7.1: Large Data Handling**
- [ ] Generate 1000 practice sessions
- [ ] Open Analytics Dashboard
- [ ] Measure load time (should be <2s)
- [ ] Check for UI lag
- [ ] Verify charts render smoothly

**Test Case 7.2: Sync Queue Size**
- [ ] Add 100 items to sync queue
- [ ] Trigger sync
- [ ] Monitor CPU usage
- [ ] Check memory consumption
- [ ] Verify all items process within 30s

### Memory Testing
**Test Case 7.3: Memory Leaks**
- [ ] Navigate between screens 50 times
- [ ] Check DevTools memory profiler
- [ ] Verify no growing leaks
- [ ] Play 10 consecutive games
- [ ] Confirm memory is released

**Test Case 7.4: Large Dataset**
- [ ] Create 500 events
- [ ] Scroll through Events Calendar
- [ ] Verify smooth scrolling
- [ ] Check FlatList virtualization works
- [ ] Monitor frame rate (should be 60fps)

### Battery Testing
**Test Case 7.5: Background Sync**
- [ ] Enable background sync
- [ ] Put app in background
- [ ] Monitor battery usage over 1 hour
- [ ] Verify <5% battery drain
- [ ] Check sync completes

---

## Edge Cases & Error Handling

### Network Errors
**Test Case 8.1: Intermittent Connection**
- [ ] Enable/disable network rapidly
- [ ] Perform actions during toggle
- [ ] Verify queue handles changes
- [ ] Check no data loss
- [ ] Confirm sync resumes when stable

**Test Case 8.2: Slow Connection**
- [ ] Throttle network to 2G speed
- [ ] Attempt sync
- [ ] Verify timeout handling
- [ ] Check retry logic kicks in
- [ ] Confirm user-friendly error message

### Data Corruption
**Test Case 8.3: Invalid JSON**
- [ ] Manually corrupt AsyncStorage data
- [ ] Restart app
- [ ] Verify error handling
- [ ] Check default values are used
- [ ] Confirm app doesn't crash

**Test Case 8.4: Missing Data**
- [ ] Delete cache files
- [ ] Open Analytics/Events
- [ ] Verify graceful degradation
- [ ] Check empty state messages
- [ ] Confirm data re-fetches

### Boundary Conditions
**Test Case 8.5: Maximum Values**
- [ ] Reach level 100+
- [ ] Achieve 10000+ streak
- [ ] Score over 999,999 points
- [ ] Verify UI displays correctly
- [ ] Check no integer overflow

**Test Case 8.6: Minimum Values**
- [ ] New user (0 XP, level 1)
- [ ] View Analytics
- [ ] Verify empty states
- [ ] Check helpful onboarding messages
- [ ] Confirm no division by zero errors

---

## Accessibility Testing

### Screen Reader
**Test Case 9.1: VoiceOver (iOS)**
- [ ] Enable VoiceOver
- [ ] Navigate home screen
- [ ] Verify all buttons are labeled
- [ ] Check game elements are accessible
- [ ] Confirm score announcements work

**Test Case 9.2: TalkBack (Android)**
- [ ] Enable TalkBack
- [ ] Navigate through app
- [ ] Verify proper focus order
- [ ] Check descriptions are clear
- [ ] Confirm gestures work

### Visual Accessibility
**Test Case 9.3: High Contrast**
- [ ] Enable high contrast mode
- [ ] Check all text is readable
- [ ] Verify button borders are visible
- [ ] Confirm sufficient color contrast (WCAG AA)

**Test Case 9.4: Large Text**
- [ ] Enable large text (200%)
- [ ] Navigate through app
- [ ] Verify layouts don't break
- [ ] Check text doesn't overflow
- [ ] Confirm buttons remain tappable

### Motor Accessibility
**Test Case 9.5: Touch Targets**
- [ ] Measure all touch targets
- [ ] Verify minimum 44x44 points
- [ ] Check adequate spacing between buttons
- [ ] Test with assistive touch

---

## Regression Testing Checklist

After each update, run this quick checklist:

- [ ] App launches without crash
- [ ] Login/authentication works
- [ ] Core gameplay (one game of each mode)
- [ ] XP and level progression
- [ ] Settings save and load
- [ ] Leaderboard displays
- [ ] Offline mode works
- [ ] Analytics loads
- [ ] Events calendar displays
- [ ] No console errors
- [ ] Performance is acceptable (no lag)

---

## Bug Reporting Template

When reporting bugs, include:

```
**Bug Title:** [Brief description]

**Severity:** [Critical/High/Medium/Low]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** [What should happen]

**Actual Result:** [What actually happened]

**Screenshots:** [If applicable]

**Device Info:**
- Device: [e.g., iPhone 14 Pro]
- OS: [e.g., iOS 17.1]
- App Version: [e.g., 1.2.3]

**Additional Context:** [Any other relevant information]
```

---

## Automated Testing

### Unit Tests
**Coverage Goals:**
- [ ] Analytics calculations: 90%+
- [ ] Sync queue logic: 95%+
- [ ] Event scheduling: 90%+
- [ ] Conflict resolution: 100%

### Integration Tests
**Priority Flows:**
- [ ] Complete game → score submission → leaderboard update
- [ ] Offline actions → reconnect → auto-sync
- [ ] Create goal → track progress → completion
- [ ] Join event → play → submit score → view rank

### E2E Tests
**Critical Paths:**
- [ ] Onboarding → first game → level completion
- [ ] Daily practice → streak maintenance → reward claim
- [ ] Event participation → leaderboard → reward claim

---

## Performance Benchmarks

**Target Metrics:**
- App launch: <2 seconds
- Screen transitions: <300ms
- Analytics dashboard load: <1.5 seconds
- Events calendar load: <1 second
- Sync 100 items: <10 seconds
- Frame rate: 60fps sustained

---

## Sign-Off

**Tested By:** _______________
**Date:** _______________
**Version:** _______________
**Status:** ✅ Pass / ❌ Fail

**Notes:**
_______________________________________
_______________________________________
