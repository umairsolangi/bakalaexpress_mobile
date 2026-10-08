import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CustomerReview } from '../../api/types';
import { formatKarachiDateTime } from '../../utils/date';
import { theme } from '../../theme';

export interface ReviewCardProps {
  review: CustomerReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const stars = '★'.repeat(Math.max(1, Math.min(5, review.rating)));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.reviewerWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {review.reviewer_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
            {review.created_at ? (
              <Text style={styles.date}>
                {formatKarachiDateTime(review.created_at, 'DD MMM YYYY')}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.stars}>{stars}</Text>
      </View>

      {review.feedback ? (
        <Text style={styles.feedback}>{review.feedback}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  reviewerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  reviewerName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  date: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  stars: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  feedback: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
});
