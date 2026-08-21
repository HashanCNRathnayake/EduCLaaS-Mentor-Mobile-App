/**
 * ChatBubble — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Inline action icons → size 20 (Microsoft Android rule)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  useWindowDimensions,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { Message } from '../../src/types';

interface ChatBubbleProps {
  message: Message;
  onSaveToNote?: (message: Message) => void;
  onCopy?: (message: Message) => void;
  onShare?: (message: Message) => void;
onQuickReply?: (value: string) => void;
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function hasHtmlMarkup(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtmlTags(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

type TableData = {
  headers: string[];
  rows: string[][];
};

function parseTableHtml(tableHtml: string): TableData | null {
  const rowMatches = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
  const rows = rowMatches
    .map((rowMatch) => {
      const rowContent = rowMatch[1] ?? '';
      const cells = Array.from(rowContent.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi))
        .map((cellMatch) => stripHtmlTags(cellMatch[2] ?? ''))
        .filter((value) => value.length > 0);
      return cells;
    })
    .filter((cells) => cells.length > 0);

  if (rows.length === 0) {
    return null;
  }

  const headers = rows[0];
  const rowsWithoutHeaders = rows.slice(1);

  if (headers.length === 0) {
    return null;
  }

  return {
    headers,
    rows: rowsWithoutHeaders,
  };
}

function splitHtmlIntoBlocks(html: string): ({ type: 'html'; html: string } | { type: 'table'; html: string })[] {
  const blocks: ({ type: 'html'; html: string } | { type: 'table'; html: string })[] = [];
  const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before.trim()) {
      blocks.push({ type: 'html', html: before });
    }

    blocks.push({ type: 'table', html: match[0] });
    lastIndex = tableRegex.lastIndex;
  }

  const tail = html.slice(lastIndex);
  if (tail.trim()) {
    blocks.push({ type: 'html', html: tail });
  }

  if (blocks.length === 0 && html.trim()) {
    blocks.push({ type: 'html', html });
  }

  return blocks;
}

function normalizeHtmlSpacing(html: string): string {
  const collapsedBreaks = html.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br /><br />');
  const trimmedLeadingBreaks = collapsedBreaks.replace(/^(?:\s*<br\s*\/?>)+/i, '');

  return trimmedLeadingBreaks.replace(/style="([^"]*)"/gi, (_match, styleContent: string) => {
    const cleanedStyle = styleContent
      .replace(/(^|;)\s*margin-top\s*:[^;]*;?/gi, '$1')
      .replace(/(^|;)\s*margin-bottom\s*:[^;]*;?/gi, '$1')
      .replace(/(^|;)\s*line-height\s*:[^;]*;?/gi, '$1');

    const normalized = cleanedStyle
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join('; ');

    return normalized ? `style="${normalized}"` : '';
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(text: string): string {
  const withLinks = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, '<a href="$2">$1</a>');
  const withCode = withLinks.replace(/`([^`]+)`/g, '<code>$1</code>');
  const withBold = withCode.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function plainTextToHtml(text: string): string {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();
  if (!normalizedText) {
    return '';
  }

  const lines = normalizedText.split(/\n{2,}/g);
  const htmlBlocks = lines.map((block) => {
    const escaped = escapeHtml(block).replace(/\n/g, '<br />');
    return `<p>${renderInlineMarkdown(escaped)}</p>`;
  });

  return htmlBlocks.join('');
}

function renderHtmlBlock(html: string, key: string, contentWidth: number) {
  const normalizedHtml = normalizeHtmlSpacing(html);

  return (
    <RenderHTML
      key={key}
      contentWidth={contentWidth}
      source={{ html: normalizedHtml }}
      baseStyle={styles.botHtmlBase}
      tagsStyles={{
        p: { marginTop: 0, marginBottom: spacing.sm, color: colors.neutralForeground1 },
        h3: { marginTop: spacing.sm, marginBottom: spacing.xs, fontSize: 17, fontWeight: '700', color: colors.neutralForeground1 },
        h4: { marginTop: spacing.sm, marginBottom: spacing.xs, fontSize: 16, fontWeight: '700', color: colors.neutralForeground1 },
        ol: { marginTop: 0, marginBottom: spacing.sm, paddingLeft: 18 },
        ul: { marginTop: 0, marginBottom: spacing.sm, paddingLeft: 18 },
        li: { marginBottom: spacing.xs, color: colors.neutralForeground1 },
        a: { color: colors.brandPrimary, textDecorationLine: 'underline' },
        div: { color: colors.neutralForeground1 },
        br: { marginBottom: 2 },
      }}
      renderersProps={{
        a: {
          onPress: (_event, href) => {
            if (!href) return;
            Linking.openURL(href).catch(() => undefined);
          },
        },
      }}
    />
  );
}

function renderPlainTextBlock(text: string, key: string, contentWidth: number) {
  return renderHtmlBlock(plainTextToHtml(text), key, contentWidth);
}

function renderTableBlock(tableHtml: string, key: string, contentWidth: number) {
  const parsed = parseTableHtml(tableHtml);
  if (!parsed) {
    return null;
  }

  const columnCount = Math.max(parsed.headers.length, ...parsed.rows.map((row) => row.length), 1);
  const tableContainerWidth = Math.max(180, contentWidth - (spacing.lg * 2));
  const baseColumnWidth = 140;
  const maxTableWidth = Math.max(280, columnCount * baseColumnWidth);
  const shouldScroll = columnCount > 2 && maxTableWidth > tableContainerWidth;
  const columnWidth = shouldScroll
    ? baseColumnWidth
    : Math.max(80, Math.floor(tableContainerWidth / columnCount));
  const tableWidth = shouldScroll ? maxTableWidth : tableContainerWidth;

  const tableView = (
    <View style={[styles.table, { minWidth: tableWidth, width: tableWidth }]}> 
      <View style={styles.tableRow}>
        {parsed.headers.map((header, index) => (
          <View
            key={`header-${key}-${index}`}
            style={[styles.tableCell, styles.tableHeaderCell, { width: columnWidth }]}
          >
            <Text style={styles.tableHeaderText}>{header}</Text>
          </View>
        ))}
      </View>

      {parsed.rows.map((row, rowIndex) => (
        <View key={`row-${key}-${rowIndex}`} style={styles.tableRow}>
          {parsed.headers.map((_, columnIndex) => {
            const value = row[columnIndex] ?? '';
            return (
              <View key={`cell-${key}-${rowIndex}-${columnIndex}`} style={[styles.tableCell, { width: columnWidth }]}> 
                <Text style={styles.tableCellText}>{value || '—'}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );

  if (!shouldScroll) {
    return (
      <View key={key} style={styles.tableBlockWrap}>
        {tableView}
      </View>
    );
  }

  return (
    <View key={key} style={styles.tableBlockWrap}>
      <View style={styles.tableHintBanner}>
        <FluentIcon name="more" size={20} color={colors.neutralForeground3} active={false} />
        <Text style={styles.tableHintText}>Swipe left or right to see more columns</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.tableScrollContent}
      >
        {tableView}
      </ScrollView>
    </View>
  );
}

export default function ChatBubble({
  message,
  onSaveToNote,
  onCopy,
  onShare,
  onQuickReply,
}: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const { width: screenWidth } = useWindowDimensions();
  const isBotHtml = !isUser && hasHtmlMarkup(message.text);
  const bubbleContentWidth = Math.max(220, Math.floor(screenWidth * 0.8) - (spacing.lg * 2));
  const htmlBlocks = isBotHtml ? splitHtmlIntoBlocks(message.text) : [];

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
      {!isUser && (
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        </View>
      )}

      <View style={styles.contentColumn}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          {isBotHtml ? (
            <>
              {htmlBlocks.map((block, index) => {
                if (block.type === 'table') {
                  return renderTableBlock(block.html, `${message.id}-table-${index}`, bubbleContentWidth);
                }

                return renderHtmlBlock(block.html, `${message.id}-html-${index}`, bubbleContentWidth);
              })}
            </>
          ) : (
            renderPlainTextBlock(message.text, `${message.id}-plain`, bubbleContentWidth)
          )}
        </View>

        <Text style={[styles.timestamp, isUser ? styles.timestampRight : styles.timestampLeft]}>
          {formatTime(message.timestamp)}
        </Text>

        {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
          <View style={styles.quickRepliesRow}>
            {message.quickReplies.map((reply, index) => (
              <Pressable
                key={`${message.id}-${reply.value}-${index}`}
                style={({ pressed }) => [styles.quickReplyButton, pressed && styles.actionButtonPressed]}
                onPress={() => {
  if (reply.type === 'openUrl') {
    Linking.openURL(reply.value).catch(() => undefined);
    return;
  }

  onQuickReply?.(reply.value);
}}
                accessibilityRole="button"
                accessibilityLabel={`Quick reply ${reply.label}`}
              >
                <Text style={styles.quickReplyText}>{reply.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!isUser && (
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                message.isSaved && styles.actionButtonSaved,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onSaveToNote?.(message)}
              accessibilityLabel="Save to note"
              accessibilityRole="button"
            >
              <FluentIcon
                name="bookmark"
                size={20}
                color={message.isSaved ? colors.brandSecondary : colors.neutralForeground2}
                active={Boolean(message.isSaved)}
              />
              <Text style={[styles.actionLabel, message.isSaved && styles.actionLabelSaved]}>
                {message.isSaved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() => onCopy?.(message)}
              accessibilityLabel="Copy message"
              accessibilityRole="button"
            >
              <FluentIcon name="copy" size={20} color={colors.neutralForeground2} active={false} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.subtle,
    color: colors.brandForegroundOnPrimary,
    fontWeight: '700',
  },
  contentColumn: {
    maxWidth: '80%',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  userBubble: {
    backgroundColor: colors.messageUserBackground,
    borderBottomRightRadius: radius.xs,
    ...shadows.level1,
  },
  botBubble: {
    backgroundColor: colors.messageBotBackground,
    borderBottomLeftRadius: radius.xs,
  },
  messageText: {
    ...typography.body1,
  },
  userText: {
    color: colors.neutralForeground1,
  },
  botText: {
    color: colors.neutralForeground1,
  },
  botHtmlBase: {
    ...typography.body1,
    color: colors.neutralForeground1,
  },
  tableScrollContent: {
    paddingVertical: spacing.xs,
  },
  tableBlockWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tableHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.neutralBackground2,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.neutralStrokeSubtle,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutralStrokeSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tableHeaderCell: {
    backgroundColor: colors.neutralBackground2,
  },
  tableHeaderText: {
    ...typography.captionStrong,
    color: colors.neutralForeground1,
  },
  tableCellText: {
    ...typography.caption,
    color: colors.neutralForeground1,
  },
  tableHintText: {
    ...typography.captionStrong,
    color: colors.neutralForeground2,
  },
  timestamp: {
    ...typography.subtle,
    color: colors.neutralForeground3,
    marginTop: spacing.xs,
  },
  timestampLeft: {
    textAlign: 'left',
    marginLeft: spacing.xs,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  quickReplyButton: {
    borderWidth: 1,
    borderColor: colors.neutralStroke,
    backgroundColor: colors.neutralBackground1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickReplyText: {
    ...typography.caption,
    color: colors.brandPrimary,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  actionButtonPressed: {
    opacity: 0.5,
    backgroundColor: colors.neutralBackground2,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.neutralForeground2,
  },
  actionButtonSaved: {
    backgroundColor: colors.neutralBackground2,
  },
  actionLabelSaved: {
    color: colors.brandSecondary,
    fontWeight: '700',
  },
});