import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

const { width } = Dimensions.get('window');

interface ProgressChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  height?: number;
  title?: string;
  color?: string;
}

function ProgressChart({
  data,
  maxValue,
  height = 120,
  title,
  color = COLORS.xpGradientStart,
}: ProgressChartProps) {
  const chartWidth = width - SPACING.md * 4;
  const barWidth = data.length > 0 ? (chartWidth - (data.length - 1) * 4) / data.length : 0;
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.chart, { height }]}>
        <View style={styles.bars}>
          {data.map((item, index) => {
            const barHeight = (item.value / max) * (height - 30);
            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height: Math.max(barHeight, 4),
                      backgroundColor: color,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  chart: {
    justifyContent: 'flex-end',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  barLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: SPACING.xs,
    position: 'absolute',
    bottom: 0,
  },
});

export default memo(ProgressChart);
