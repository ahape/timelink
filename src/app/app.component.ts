import { CommonModule } from "@angular/common"
import { Component, OnInit } from "@angular/core"
import { RouterOutlet, ActivatedRoute, ParamMap } from "@angular/router"

function timePartToString(timePart: number): string {
  return timePart.toString().padStart(2, "0")
}

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
  timeValue: Date | undefined
  timeZone = ""
  timeZoneNames: string[] = []
  timeZoneList: string[] = []

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.timeZoneNames = Intl.supportedValuesOf("timeZone")

    this.route.queryParamMap.subscribe((queryParamMap) => {
      this.tryLoadViaParams(queryParamMap)
    })
  }

  timeStringToDate(time: string): Date {
    const parts = time.split(":").map((p) => p.trim())
    if (parts.length < 2 || parts.some((p) => isNaN(parseInt(p, 10)))) {
      return invalidDate
    }
    if (parts.length == 2) parts.push("0")
    const [h, m, s] = parts.slice(0, 3).map((p) => parseInt(p, 10))
    return new Date(seed.setHours(h, m, s))
  }

  formatTimeForRoundTrip(date: Date): string {
    const h = timePartToString(date.getUTCHours())
    const m = timePartToString(date.getUTCMinutes())
    const s = timePartToString(date.getUTCSeconds())
    return `${h}:${m}:${s}`
  }

  formatTimeForDisplay(date: Date, timeZone: string): string {
    return Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeStyle: "long",
      timeZone,
    }).format(date)
  }

  createLink(): string {
    let hostname = location.hostname
    if (hostname.includes("localhost")) hostname += ":" + location.port
    const t = encodeURIComponent(this.formatTimeForRoundTrip(this.timeValue!))
    return `${location.protocol}//${hostname}?t=${t}`
  }

  change(event: Event) {
    this.update((<HTMLInputElement>event.target).value)
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
      this.update(
        `${timePartToString(local.getHours())}:${timePartToString(local.getMinutes())}:${timePartToString(local.getSeconds())}`
      )
    }
  }

  updateTimeZoneList(timeValue: Date) {
    const set = new Set<string>()
    for (const timeZone of this.timeZoneNames)
      set.add(this.formatTimeForDisplay(timeValue, timeZone))
    let arr = Array.from(set).sort()
    const localIndex = arr.indexOf(this.timeTextDisplay)
    if (localIndex > -1)
      arr = [
        ...arr.slice(localIndex), // Make local time the top one
        ...arr.slice(0, localIndex),
      ]
    this.timeZoneList = arr
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
