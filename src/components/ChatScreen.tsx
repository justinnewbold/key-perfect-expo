import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import GlassCard from './GlassCard';
import {
  ChatMessage,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from '../services/social';
import { getUserProfile } from '../services/leaderboard';

interface ChatScreenProps {
  friendId: string;
  friendName: string;
  friendAvatar: string;
}

export default function ChatScreen({ friendId, friendName, friendAvatar }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const initializeChat = async () => {
      const profile = await getUserProfile();
      setUserId(profile.id);
      setUserName(profile.displayName);
      setUserAvatar(profile.avatarEmoji);

      // Use profile ID directly, not from state
      await loadMessages(profile.id);
    };
    initializeChat();

    return () => {
      isMountedRef.current = false;
    };
  }, [friendId]);

  const loadMessages = async (currentUserId?: string) => {
    const id = currentUserId || userId;
    if (!id) return;

    const msgs = await getMessages(id, friendId);
    setMessages(msgs);
    await markMessagesAsRead(id, friendId);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;

    const message = await sendMessage(
      userId,
      userName,
      userAvatar,
      friendId,
      inputText.trim()
    );

    setMessages(prev => [...prev, message]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      if (isMountedRef.current) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const sendEmoji = async (emoji: string) => {
    const message = await sendMessage(
      userId,
      userName,
      userAvatar,
      friendId,
      emoji,
      'emoji'
    );

    setMessages(prev => [...prev, message]);

    setTimeout(() => {
      if (isMountedRef.current) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === userId;

    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
        {!isMe && <Text style={styles.messageAvatar}>{item.senderAvatar}</Text>}

        <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
          {item.type === 'emoji' ? (
            <Text style={styles.emojiMessage}>{item.content}</Text>
          ) : (
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.content}
            </Text>
          )}
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isMe && <Text style={styles.messageAvatar}>{item.senderAvatar}</Text>}
      </View>
    );
  };

  const quickEmojis = ['👍', '❤️', '😊', '🎵', '🔥', '⭐'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        windowSize={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        initialNumToRender={20}
      />

      {/* Quick Emojis */}
      <View style={styles.quickEmojis}>
        {quickEmojis.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiButton}
            onPress={() => sendEmoji(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  messageContainerMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    fontSize: 24,
    marginHorizontal: SPACING.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderBottomLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary + '40',
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  messageTextMe: {
    color: COLORS.textPrimary,
  },
  emojiMessage: {
    fontSize: 32,
  },
  messageTime: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  messageTimeMe: {
    color: COLORS.textSecondary,
  },
  quickEmojis: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground + '40',
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.glass,
  },
});
