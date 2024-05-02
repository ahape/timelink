export type TimeZoneInfo = {
  /** Long, generic name for a time zone */
  name: string
  /** @example "(GMT-2)"" */
  gmtOffset: string
  /** @example "13:12:11" */
  time: string
  /** List of all IANA time zones w/in our generic time zone (name) */
  regions: string[]
}
