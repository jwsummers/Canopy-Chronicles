import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Block, Text, theme } from 'galio-framework';
import { Ionicons } from '@expo/vector-icons';
import { argonTheme } from '../constants';

const ActivityItem = ({ activity, onPress }) => {
  const getActivityDetails = () => {
    switch (activity.type) {
      case 'add_grow':
        return {
          icon: 'add-circle',
          color: argonTheme.COLORS.SUCCESS,
          message: `Added new grow: ${activity.growName}`,
        };
      case 'update_stage':
        return {
          icon: 'arrow-forward-circle',
          color: argonTheme.COLORS.INFO,
          message: `${activity.growName} entered ${activity.newStage} stage`,
        };
      case 'add_event':
        return {
          icon: 'calendar',
          color: argonTheme.COLORS.WARNING,
          message: `${activity.eventName} event added to ${activity.growName}`,
        };
      case 'finish_grow':
        return {
          icon: 'checkmark-circle',
          color: argonTheme.COLORS.PRIMARY,
          message: `Completed grow: ${activity.growName}`,
        };
      case 'add_image':
        return {
          icon: 'image',
          color: argonTheme.COLORS.INFO,
          message: `Added new image to ${activity.growName}`,
        };
      case 'add_note':
        return {
          icon: 'create',
          color: argonTheme.COLORS.WARNING,
          message: `Added new note to ${activity.growName}`,
        };
      default:
        return {
          icon: 'information-circle',
          color: argonTheme.COLORS.MUTED,
          message: 'Unknown activity',
        };
    }
  };

  const { icon, color, message } = getActivityDetails();

  return (
    <TouchableOpacity onPress={() => onPress(activity)}>
      <Block flex row style={styles.activityItem}>
        <Block center style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
        </Block>
        <Block flex style={styles.activityContent}>
          <Text size={14}>{message}</Text>
          <Text size={12} color={argonTheme.COLORS.MUTED}>
            {new Date(activity.timestamp).toLocaleString()}
          </Text>
        </Block>
      </Block>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activityItem: {
    marginBottom: theme.SIZES.BASE,
    backgroundColor: argonTheme.COLORS.WHITE,
    borderRadius: 8,
    padding: theme.SIZES.BASE,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SIZES.BASE,
  },
  activityContent: {
    justifyContent: 'center',
  },
});

export default ActivityItem;
