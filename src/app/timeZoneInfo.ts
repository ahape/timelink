export type TimeZoneInfo = {
  /** @example "Pacific Standard Time" */
  name: string
  /** @example "PST" */
  shortName: string
  /** @example "(GMT-2)" */
  gmtOffset: string
  /** @example "13:12:11" */
  time: string
  /** List of all IANA time zones w/in our generic time zone (name) */
  regions: string[]
}
