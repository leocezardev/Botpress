import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import { MetricEntry } from '../../backend/typings'

import { Extras } from './index'
import style from './style.scss'

const CHANNEL_COLORS = {
  web: '#1F8FFA',
  messenger: '#0196FF',
  slack: '#4A154B',
  telegram: '#2EA6DA'
}

interface Props extends Extras {
  name: string
  data: MetricEntry[] | any
  channels: string[]
}

const mapDataForCharts = (data: MetricEntry[]) => {
  const chartsData = data.map(metric => ({
    time: moment(metric.date)
      .startOf('day')
      .unix(),
    [metric.channel]: metric.value
  }))

  return _.sortBy(chartsData, 'time')
}

const formatTick = timestamp =>
  moment
    .unix(timestamp)
    .format('ddd')
    .substr(0, 1)
const formatTootilTick = timestamp => moment.unix(timestamp).format('dddd, MMMM Do YYYY')

const TimeSeriesChart: FC<Props> = props => {
  const { data, name, className, channels } = props

  return (
    <div className={cx(style.metricWrapper, { [style.empty]: !data.length }, className)}>
      <div className={cx(style.chartMetric, { [style.empty]: !data.length })}>
        <h3 className={style.metricName}>
          <span>{name}</span>
        </h3>
        {!data.length && <p className={style.emptyState}>No data available</p>}
        {!!data.length && (
          <ResponsiveContainer height={160}>
            <AreaChart data={mapDataForCharts(data)}>
              <defs>
                <linearGradient id="gradientBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F90FA" stopOpacity={0.31} />
                  <stop offset="45%" stopColor="#1F90FA" stopOpacity={0.34} />
                  <stop offset="73%" stopColor="#1F90FA" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1F90FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip labelFormatter={formatTootilTick} />
              <XAxis
                tickMargin={10}
                height={28}
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTick}
                tickCount={data.length}
              />
              {channels
                .filter(x => x !== 'all')
                .map((channel, idx) => (
                  <Area
                    key={idx}
                    type="monotone"
                    dataKey={channel}
                    strokeWidth={3}
                    stroke={CHANNEL_COLORS[channel]}
                    fill="url(#gradientBg)"
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default TimeSeriesChart
