import { CommonModule } from "@angular/common"
import { Component, OnInit } from "@angular/core"
import { RouterOutlet, ActivatedRoute, ParamMap } from "@angular/router"
import { TimeZoneListItemComponent } from "./time-zone-list-item/time-zone-list-item.component"
import { TimeZoneInfo } from "./timeZoneInfo"
import { BehaviorSubject } from "rxjs"
import { Lookup } from "./lookup"

const invalidDate = new Date(NaN)
const seed = new Date()

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, CommonModule, TimeZoneListItemComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  title = "timelink"
  /** <input type="time" /> value */
  timeText = ""
  timeValue = invalidDate
  /** IANA time zone name */
  currentTimeZoneName = ""
  currentTimeZoneInfo: TimeZoneInfo | undefined
  /** IANA time zone names */
  timeZoneNames: string[] = []
  timeZoneInfos = new BehaviorSubject<TimeZoneInfo[]>([]);
  timeZoneInfosByGmtOffset = new Lookup<TimeZoneInfo>()
  regionsDisplayed: string[] = []
  regionsDisplayedLocked = false
  lastHoveredInfo: TimeZoneInfo | undefined

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.currentTimeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.timeZoneNames = Intl.supportedValuesOf("timeZone")
    this.timeZoneInfos.subscribe(value => {
      this.timeZoneInfosByGmtOffset.clear()
      value.forEach(info => {
        this.timeZoneInfosByGmtOffset.addOrUpdate(info.gmtOffset, info)
      })
    })

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

  timePartToString(timePart: string): string
  timePartToString(timePart: number): string
  timePartToString(timePart: number | string): string {
    if (typeof timePart === "string") timePart = parseInt(timePart, 10)
    return String(timePart).padStart(2, "0")
  }

  dateToTimeParts(date: Date, asUtc: boolean): [string, string, string] {
    const UTC = asUtc ? "UTC" : ""
    return [
      this.timePartToString(date[`get${UTC}Hours`]()),
      this.timePartToString(date[`get${UTC}Minutes`]()),
      this.timePartToString(date[`get${UTC}Seconds`]()),
    ]
  }

  formatTime(date: Date, roundTrip: boolean): string {
    return this.dateToTimeParts(date, roundTrip).join(":")
  }

  createTimeZoneInfo(date: Date, timeZone: string): TimeZoneInfo {
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
    const partsShort = Intl.DateTimeFormat("en-US", {
      timeZoneName: "shortOffset",
      timeZone,
    }).formatToParts(date)
    const ymd = [
      getPart(parts, "year"),
      this.timePartToString(getPart(parts, "month")),
      this.timePartToString(getPart(parts, "day")),
    ].join("-")
    const hms = [
      this.timePartToString(getPart(parts, "hour")),
      this.timePartToString(getPart(parts, "minute")),
      this.timePartToString(getPart(parts, "second")),
    ].join(":")
    return {
      time: `${ymd} ${hms}`,
      name: getPart(parts, "timeZoneName"),
      gmtOffset: getPart(partsShort, "timeZoneName"),
      regions: [],
    }
    function getPart(parts: Intl.DateTimeFormatPart[], type: string): string {
      return parts.find((p) => p.type === type)?.value!
    }
  }

  createLink(): string {
    let hostname = location.hostname
    if (hostname.includes("localhost")) hostname += ":" + location.port
    const t = encodeURIComponent(this.formatTime(this.timeValue!, true))
    return `${location.protocol}//${hostname}?t=${t}`
  }

  displayRegionsFor(info: TimeZoneInfo) {
    const hovered = this.timeZoneInfos.getValue().find((x) => x.name === info.name)
    this.regionsDisplayed = hovered?.regions ?? []
  }

  deselectInfo() {
    const cleanUp = Array.from(document.getElementsByClassName("selected"))
    for (const el of cleanUp) el.classList.remove("selected")
    this.regionsDisplayed = []
  }

  selectInfo(infoElement: HTMLElement, info: TimeZoneInfo) {
    infoElement.classList.add("selected")
    this.displayRegionsFor(info)
    this.regionsDisplayedLocked = true
  }

  infoScrollHandler() {
    if (this.regionsDisplayedLocked) {
      this.regionsDisplayedLocked = false
      this.deselectInfo()
      if (this.lastHoveredInfo) this.displayRegionsFor(this.lastHoveredInfo)
    }
  }

  hoverHandler(info: TimeZoneInfo) {
    if (!this.regionsDisplayedLocked) {
      this.displayRegionsFor(info)
    }
    this.lastHoveredInfo = info
  }

  infoClickHandler(event: Event, info: TimeZoneInfo) {
    this.deselectInfo()
    this.selectInfo(event.target as HTMLElement, info)
  }

  inputChangeHandler(event: Event) {
    this.update((event.target as HTMLInputElement).value)
  }

  /** After clicking copy, a little tooltip-esque element fades in and out */
  async copyLinkClickHandler() {
    let feedback: HTMLElement
    if (this.timeValue !== invalidDate) {
      feedback = document.getElementById("copy-feedback")!
      if (feedback.classList.contains("show")) {
        fadeOutDone()
      }
      feedback.classList.add("show")

      await this.copyLinkToClipboard(this.createLink())

      feedback.dataset["fadeOutHandle"] = <any>setTimeout(fadeOutDone, 1000)
    }

    function fadeOutDone() {
      const timeoutHandle = feedback?.dataset["fadeOutHandle"]
      if (timeoutHandle) clearTimeout(parseInt(timeoutHandle, 10))
      feedback?.classList.remove("show")
    }
  }

  update(timeText: string) {
    this.timeText = timeText
    this.timeValue = this.timeStringToDate(timeText)
    if (this.timeValue !== invalidDate) {
      this.currentTimeZoneInfo = this.createTimeZoneInfo(
        this.timeValue,
        this.currentTimeZoneName
      )
      this.updateTimeZoneList(this.timeValue)
    } else {
      this.timeZoneInfos.next([])
    }
  }

  tryLoadViaParams(paramMap: ParamMap) {
    const paramTime = decodeURIComponent(paramMap.get("t") ?? "")
    if (paramTime) {
      // 2024-05-01T10:10:10.000Z
      //            ^^ ^^ ^^
      // Swap out these for the passed in param of "HH:MM:SS"
      const modifiedIso = seed
        .toISOString()
        .replace(/\d{2}:\d{2}:\d{2}/, paramTime)
      const localTimeText = this.formatTime(new Date(modifiedIso), false)
      this.update(localTimeText)
    }
  }

  updateTimeZoneList(timeValue: Date) {
    const dict: Record<string, TimeZoneInfo> = {}
    for (const tz of this.timeZoneNames) {
      let info = this.createTimeZoneInfo(timeValue, tz)
      info = dict[info.name] ??= info // Take existing entry, otherwise the new one
      info.regions.push(tz)
    }
    const sortedInfos = Object.values(dict).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    this.timeZoneInfos.next(sortedInfos)
    // Needs to be deferred
    setTimeout(this.scrollToInfo, 1, sortedInfos, this.currentTimeZoneInfo?.name)
  }

  scrollToInfo(infos: TimeZoneInfo[], infoName: string) {
    const listElement = document.getElementById(
      "time-zone-list"
    ) as HTMLUListElement
    const localIndex = infos.findIndex(
      (info) => info.name === infoName
    )
    if (listElement && localIndex !== -1) {
      listElement.children[localIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
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
