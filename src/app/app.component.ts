import { CommonModule } from "@angular/common"
import { Component, OnInit } from "@angular/core"
import { RouterOutlet, ActivatedRoute, ParamMap } from "@angular/router"

const invalidDate = new Date(NaN)
const seed = new Date()

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  title = "timelink"
  timeText = ""
  timeTextDisplay = ""
  timeValue = invalidDate
  timeZone = ""
  timeZoneNames: string[] = []
  timeZoneList: string[] = []
  regionLookup: Record<string, string[]> = {}

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.timeZoneNames = Intl.supportedValuesOf("timeZone")

    // Start off with the current time
    this.update(this.formatTime(new Date(), false))

    this.route.queryParamMap.subscribe((queryParamMap) => {
      this.tryLoadViaParams(queryParamMap)
    })
  }

  validateTimeText(time: string): boolean {
    return /^\d{2}:\d{2}(:\d{2})?$/.test(time)
  }

  timeStringToDate(time: string): Date {
    if (!this.validateTimeText(time)) return invalidDate
    const [h, m] = time.split(":").map((p) => parseInt(p, 10))
    return new Date(seed.setHours(h, m, 0))
  }

  timePartToString(timePart: number): string {
    return timePart.toString().padStart(2, "0")
  }

  dateToTimeParts(date: Date, asUtc: boolean): [string, string, string] {
    const h = this.timePartToString(
      asUtc ? date.getUTCHours() : date.getHours()
    )
    const m = this.timePartToString(
      asUtc ? date.getUTCMinutes() : date.getMinutes()
    )
    const s = this.timePartToString(
      asUtc ? date.getUTCSeconds() : date.getSeconds()
    )
    return [h, m, s]
  }

  formatTime(date: Date, roundTrip: boolean): string {
    return this.dateToTimeParts(date, roundTrip).join(":")
  }

  formatTimeForDisplay(date: Date, timeZone: string): string {
    const parts = Intl.DateTimeFormat("en-US", {
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "longGeneric",
      timeZone,
    }).formatToParts(date)
    const year = parts.find((p) => p.type === "year")?.value!
    const month = parts.find((p) => p.type === "month")?.value!
    const day = parts.find((p) => p.type === "day")?.value!
    const hour = parts.find((p) => p.type === "hour")?.value!
    const minute = parts.find((p) => p.type === "minute")?.value!
    const second = parts.find((p) => p.type === "second")?.value!
    const timeZoneName = parts.find((p) => p.type === "timeZoneName")?.value!
    const parts2 = Intl.DateTimeFormat("en-US", {
      timeZoneName: "shortOffset",
      timeZone,
    }).formatToParts(date)
    const gmtOffset = parts2.find(p => p.type === "timeZoneName")?.value!
    const ymd = [
      year,
      this.timePartToString(parseInt(month, 10)),
      this.timePartToString(parseInt(day, 10)),
    ].join("-");
    const hms = [
      this.timePartToString(parseInt(hour, 10)),
      this.timePartToString(parseInt(minute, 10)),
      this.timePartToString(parseInt(second, 10)),
    ].join(":")
    return `${ymd} ${hms} ${timeZoneName} (${gmtOffset})`
  }

  createLink(): string {
    let hostname = location.hostname
    if (hostname.includes("localhost")) hostname += ":" + location.port
    const t = encodeURIComponent(this.formatTime(this.timeValue!, true))
    return `${location.protocol}//${hostname}?t=${t}`
  }

  inputChangeHandler(event: Event) {
    this.update((<HTMLInputElement>event.target).value)
  }

  async copyLinkClickHandler() {
    if (this.timeValue !== invalidDate) {
      const feedback = document.getElementById("copy-feedback")!
      if (feedback.classList.contains("show")) {
        clearTimeout(Number(feedback.dataset["fadeOutHandle"]))
        feedback.classList.remove("show")
      }
      feedback.classList.add("show")

      await this.copyLinkToClipboard(this.createLink())

      feedback.dataset["fadeOutHandle"] = setTimeout(
        () => feedback.classList.remove("show"),
        1000
      ) as any
    }
  }

  update(timeText: string) {
    this.timeText = timeText

    const date = (this.timeValue = this.timeStringToDate(timeText))
    if (date !== invalidDate) {
      this.timeTextDisplay = this.formatTimeForDisplay(date, this.timeZone)
      this.updateTimeZoneList(date)
    } else {
      this.timeZoneList = []
    }
  }

  tryLoadViaParams(paramMap: ParamMap) {
    const time = decodeURIComponent(paramMap.get("t") ?? "")
    if (time) {
      const local = new Date(
        seed.toISOString().replace(/\d{2}:\d{2}:\d{2}/, time)
      )
      this.update(this.formatTime(local, false))
    }
  }

  updateTimeZoneList(timeValue: Date) {
    const set = new Set<string>()
    for (const timeZone of this.timeZoneNames) {
      const generic = this.formatTimeForDisplay(timeValue, timeZone)
      set.add(generic)
      ;(this.regionLookup[generic] ??= []).push(timeZone)
    }
    this.timeZoneList = [...set].sort()
    setTimeout(() => this.scrollToLocal(), 1)
  }

  scrollToLocal() {
    const list = document.getElementById("time-zone-list")
    const localIndex = this.timeZoneList.indexOf(this.timeTextDisplay)
    const el = list?.children[localIndex]
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async copyLinkToClipboard(text: string) {
    try {
      const type = "text/plain"
      const blob = new Blob([text], { type })
      const data = [new ClipboardItem({ [type]: blob })]
      await navigator.clipboard.write(data)
    } catch (e) {
      document.execCommand("copy", false, text)
    }
  }
}
