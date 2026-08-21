/**
 * DrawerScreen — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Navigation icons → size 24
 * Inline actions → size 20
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { isEnabled } from '@/config/featureFlags';
import { clearSession } from '@/src/auth/session';
import { deleteSavedNote, getSavedNotes, type SavedNote } from '@/src/notes/storage';
import { getSession } from '@/lib/auth';
import FluentIcon, { FluentIconName } from '../components/FluentIcon';
import AppIcon from '../components/AppIcon';
import { colors } from '../design/tokens/colors';
import { spacing } from '../design/tokens/spacing';
import { typography } from '../design/tokens/typography';
import { radius } from '../design/tokens/radius';
import { shadows } from '../design/tokens/shadows';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

const menuItems: { id: string; label: string; icon: FluentIconName; route: string | null }[] = [
  { id: 'home', label: 'Home', icon: 'home', route: '/' },
  { id: 'saved-notes', label: 'Saved Notes', icon: 'document', route: '/saved-notes' },
  { id: 'explore', label: 'Explore', icon: 'compass', route: '/explore' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: null },
];

export default function DrawerScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('User');
  const [recentNotes, setRecentNotes] = useState<SavedNote[]>([]);

  const loadRecentNotes = React.useCallback(() => {
    getSavedNotes()
      .then((notes) => setRecentNotes(notes.slice(0, 4)))
      .catch(() => setRecentNotes([]));
  }, []);

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session?.name?.trim()) {
          setUserName(session.name.trim());
        }
      })
      .catch(() => {
        setUserName('User');
      });
  }, []);

  const userInitials = useMemo(() => {
    const first = userName.trim().charAt(0);
    return first ? first.toUpperCase() : 'U';
  }, [userName]);

  useFocusEffect(
    React.useCallback(() => {
      loadRecentNotes();
    }, [loadRecentNotes])
  );

  const handleNavigate = (route: string | null) => {
    if (route) router.replace(route as Href);
  };

  const handleClose = () => router.back();

  const handleOpenRecentNote = (noteId: string) => {
    router.replace({ pathname: '/note-detail', params: { noteId } } as Href);
  };

  const handleDeleteRecentNote = (note: SavedNote) => {
    Alert.alert('Delete note', `Remove "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedNote(note.id);
            loadRecentNotes();
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.info('[Auth] Sign-out button pressed');
    }
    try {
      await clearSession();
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.info('[Auth] Sign-out completed, redirecting to login');
      }
    } catch {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.info('[Auth] Sign-out failed while clearing session');
      }
      // ignore
    }
    // After clearing, force the login route so the user can sign in again
    try {
      router.replace('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Drawer Panel ─────────────────────────────────────────────────── */}
      <View style={styles.drawerPanel}>
        <SafeAreaView style={styles.safeArea}>

          {/* Header — navigation icons → size 24 */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <AppIcon size={84} />
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOpacity]}
              onPress={handleClose}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            >
              <FluentIcon name="dismiss" size={24} color={colors.neutralSurface} active={false} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* User Profile */}
            <View style={styles.profileSection}>
              <View style={styles.profileCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              </View>
            </View>

            {/* Navigation Menu — size 24. Active: Filled + gold + indicator. Inactive: Regular + gray. */}
            <View style={styles.menuSection}>
              {menuItems
                .filter((item) => {
                  if (item.id === 'settings' && !isEnabled('settings')) return false;
                  if (item.route === '/explore' && !isEnabled('explore')) return false;
                  return true;
                })
                .map((item) => {
                const isActive = item.route !== null && (pathname === item.route || (item.route === '/' && (pathname === '/' || pathname === '/index')));
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                      pressed && styles.menuItemPressed,
                    ]}
                    onPress={() => handleNavigate(item.route)}
                    accessibilityLabel={item.label}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isActive }}
                  >
                    <FluentIcon
                      name={item.icon}
                      size={24}
                      color={isActive ? colors.brandSecondary : colors.neutralForeground2}
                      active={isActive}
                    />
                    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
                })}
              {/* Sign out action */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleSignOut}
                accessibilityLabel="Sign out"
                accessibilityRole="button"
              >
                <FluentIcon name="dismiss" size={24} color={colors.neutralForeground2} active={false} />
                <Text style={styles.menuLabel}>Sign out</Text>
              </Pressable>
            </View>

            {/* Recent notes from saved notes storage (no hardcoded placeholders) */}
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent</Text>
              {recentNotes.length > 0 ? (
                <View style={styles.recentCard}>
                  {recentNotes.map((note, index) => (
                    <View key={note.id}>
                      <View style={styles.recentItemHeader}>
                        <Pressable
                          style={({ pressed }) => [styles.recentTitlePressable, pressed && styles.menuItemPressed]}
                          onPress={() => handleOpenRecentNote(note.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Open note ${note.title}`}
                        >
                          <Text style={styles.recentItemTitle} numberOfLines={1}>
                            {note.title}
                          </Text>
                        </Pressable>

                        <View style={styles.recentActions}>
                          <Pressable
                            style={({ pressed }) => [styles.recentActionIcon, pressed && styles.menuItemPressed]}
                            onPress={() => handleOpenRecentNote(note.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit note ${note.title}`}
                          >
                            <FluentIcon name="edit" size={20} color={colors.neutralForeground2} active={false} />
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.recentActionIcon, pressed && styles.menuItemPressed]}
                            onPress={() => handleDeleteRecentNote(note)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete note ${note.title}`}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.neutralForeground2} />
                          </Pressable>
                        </View>
                      </View>

                      <Pressable
                        style={({ pressed }) => [styles.recentPreviewPressable, pressed && styles.menuItemPressed]}
                        onPress={() => handleOpenRecentNote(note.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open note preview ${note.title}`}
                      >
                        <Text style={styles.recentItemPreview} numberOfLines={2}>
                          {note.preview}
                        </Text>
                      </Pressable>

                      {index < recentNotes.length - 1 && <View style={styles.recentDivider} />}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.recentEmptyText}>No recent notes yet</Text>
              )}
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
        accessibilityLabel="Close menu"
        accessibilityRole="button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerPanel: {
    width: DRAWER_WIDTH,
    backgroundColor: colors.neutralBackground1,
    ...shadows.level3,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.brandPrimary,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 84,
    minWidth: 160,
    marginLeft: -24,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  scroll: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.level1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.body1Strong,
    color: colors.brandForegroundOnPrimary,
  },
  userName: {
    flex: 1,
    ...typography.body1Strong,
    color: colors.brandPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  menuSection: {
    marginTop: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.sm,
    minHeight: 44,
  },
  menuItemActive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brandSecondary,
  },
  menuItemPressed: {
    backgroundColor: colors.neutralBackground2,
    opacity: 0.8,
  },
  menuLabel: {
    ...typography.body1,
    color: colors.neutralForeground2,
    marginLeft: spacing.lg,
  },
  menuLabelActive: {
    ...typography.body1Strong,
    color: colors.brandSecondary,
    marginLeft: spacing.lg,
  },
  recentSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  recentTitle: {
    ...typography.body2Strong,
    color: colors.neutralForeground2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  recentCard: {
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.level1,
  },
  recentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  recentTitlePressable: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  recentItemTitle: {
    ...typography.body2Strong,
    color: colors.neutralForeground1,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recentActionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentPreviewPressable: {
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
  },
  recentItemPreview: {
    ...typography.caption,
    color: colors.neutralForeground3,
    lineHeight: 20,
  },
  recentDivider: {
    marginVertical: spacing.sm,
    height: 1,
    backgroundColor: colors.neutralStroke,
  },
  recentEmptyText: {
    ...typography.caption,
    color: colors.neutralForeground3,
    paddingHorizontal: spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
  },
  pressedOpacity: {
    opacity: 0.5,
  },
});
