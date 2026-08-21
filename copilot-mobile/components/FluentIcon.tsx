/**
 * FluentIcon — Official Microsoft Fluent System Icons for React Native
 *
 * Architecture:
 *  - SVG path data sourced from github.com/microsoft/fluentui-system-icons
 *  - Rendered via react-native-svg (Expo managed, no ejection needed)
 *  - Strict semantic name union type — no raw Ionicon names
 *  - Only sizes 20 | 24 allowed (Microsoft Android guideline)
 *  - Color always from design tokens — never hardcoded
 *  - Default: size=24, color=neutralForeground1
 *
 * Usage:
 *   <FluentIcon name="home" size={24} color={colors.neutralForeground1} />
 *
 * To add a new icon:
 *   1. Add path data to assets/fluent-icons/index.tsx
 *   2. Add the name to FluentIconName below
 *   3. Add the mapping in iconMap
 */

import React from 'react';
import { colors as tokenColors } from '../design/tokens/colors';
import {
    IconHomeRegular,
    IconHomeFilled,
    IconDismissRegular,
    IconDismissFilled,
    IconSettingsRegular,
    IconSettingsFilled,
    IconDocumentRegular,
    IconDocumentFilled,
    IconCompassNorthwestRegular,
    IconCompassNorthwestFilled,
    IconEditRegular,
    IconEditFilled,
    IconMoreHorizontalRegular,
    IconMoreHorizontalFilled,
    IconMoreVerticalRegular,
    IconMoreVerticalFilled,
    IconBookmarkRegular,
    IconBookmarkFilled,
    IconCopyRegular,
    IconCopyFilled,
    IconShareRegular,
    IconShareFilled,
    IconSendRegular,
    IconSendFilled,
    IconAlertRegular,
    IconAlertFilled,
    IconSearchRegular,
    IconSearchFilled,
    IconAddRegular,
    IconAddFilled,
    IconArrowLeftRegular,
    IconArrowLeftFilled,
    IconCheckmarkRegular,
    IconCheckmarkFilled,
    IconPanelLeftRegular,
    IconPanelLeftFilled,
} from '../assets/fluent-icons/index';

// ── Strict semantic name union ────────────────────────────────────────────────
export type FluentIconName =
    | 'menu'
    | 'dismiss'
    | 'home'
    | 'document'
    | 'compass'
    | 'settings'
    | 'edit'
    | 'more'
    | 'moreVertical'
    | 'bookmark'
    | 'copy'
    | 'share'
    | 'send'
    | 'notification'
    | 'search'
    | 'add'
    | 'back'
    | 'checkmark';

// ── Allowed sizes (Microsoft Android guideline) ───────────────────────────────
export type FluentIconSize = 20 | 24;

interface FluentIconProps {
    name: FluentIconName;
    size?: FluentIconSize;
    color?: string;
    /** When true: Filled variant. When false: Regular variant. */
    active?: boolean;
    accessibilityLabel?: string;
}

// ── Name → SVG component mapping (Regular / Filled) ──────────────────────────
type IconComponent = (props: { size: number; color: string }) => React.ReactElement;

const iconMapRegular: Record<FluentIconName, IconComponent> = {
    menu: IconPanelLeftRegular,
    dismiss: IconDismissRegular,
    home: IconHomeRegular,
    document: IconDocumentRegular,
    compass: IconCompassNorthwestRegular,
    settings: IconSettingsRegular,
    edit: IconEditRegular,
    more: IconMoreHorizontalRegular,
    moreVertical: IconMoreVerticalRegular,
    bookmark: IconBookmarkRegular,
    copy: IconCopyRegular,
    share: IconShareRegular,
    send: IconSendRegular,
    notification: IconAlertRegular,
    search: IconSearchRegular,
    add: IconAddRegular,
    back: IconArrowLeftRegular,
    checkmark: IconCheckmarkRegular,
};

const iconMapFilled: Record<FluentIconName, IconComponent> = {
    menu: IconPanelLeftFilled,
    dismiss: IconDismissFilled,
    home: IconHomeFilled,
    document: IconDocumentFilled,
    compass: IconCompassNorthwestFilled,
    settings: IconSettingsFilled,
    edit: IconEditFilled,
    more: IconMoreHorizontalFilled,
    moreVertical: IconMoreVerticalFilled,
    bookmark: IconBookmarkFilled,
    copy: IconCopyFilled,
    share: IconShareFilled,
    send: IconSendFilled,
    notification: IconAlertFilled,
    search: IconSearchFilled,
    add: IconAddFilled,
    back: IconArrowLeftFilled,
    checkmark: IconCheckmarkFilled,
};

export default function FluentIcon({
    name,
    size = 24,
    color = tokenColors.neutralForeground1,
    active = false,
    accessibilityLabel,
}: FluentIconProps) {
    const iconMap = active ? iconMapFilled : iconMapRegular;
    const IconComponent = iconMap[name];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
}
