import { Component, OnInit } from "@angular/core"
import { RouterOutlet, ActivatedRoute, ParamMap } from "@angular/router"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  title = "timelink"
  timeText = ""
  timeTextNorm = ""
  timeValue: Date | undefined
  timeZone = ""
  timeZoneNames: string[] = []
  timeZoneList: string[] = []
  link = ""
  copyLinkText = "(copy link)"

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.timeZoneNames = Intl.supportedValuesOf("timeZone")

    this.route.queryParamMap.subscribe(queryParamMap => {
      this.tryLoadViaParams(queryParamMap)
    })
  }

  timeStringToDate(time: string): Date {
    const parts = time.split(":").map(p => p.trim())
    if (parts.length < 2 ||
        parts.some(p => isNaN(parseInt(p, 10))))
    {
      return new Date(NaN)
    }
    if (parts.length == 2)
      parts.push("0")
    const [h, m, s] = parts.slice(0, 3).map(p => parseInt(p, 10))
    const seed = new Date()
    return new Date(seed.getFullYear(), seed.getDate(), seed.getDay(), h, m, s)
  }

  formatTime(date: Date, timeZone: string): string {
    return Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeStyle: "long",
      timeZone,
    }).format(date)
  }

  createLink(): string {
    let hostname = location.hostname
    if (hostname.includes("localhost"))
      hostname += ":" + location.port
    const t = encodeURIComponent(this.timeTextNorm)
    const z = encodeURIComponent(this.timeZone)
    return `${location.protocol}//${hostname}?t=${t}&z=${z}`
  }

  change(event: Event) {
    this.update((<HTMLInputElement>event.target).value)
  }

  update(timeText: string, timeZone?: string) {
    this.timeText = timeText

    if (timeZone)
      this.timeZone = timeZone

    const date = this.timeValue = this.timeStringToDate(timeText)
    if (!isNaN(date.getTime())) {
      this.timeTextNorm = this.formatTime(date, this.timeZone)
      this.link = this.createLink()
      this.copyLinkText = "(copy link)"
      this.updateTimeZoneList(date)
    } else {
      this.timeZoneList = []
    }
  }

  tryLoadViaParams(paramMap: ParamMap) {
    const time = decodeURIComponent(paramMap.get("t") ?? "")
    const timeZone = decodeURIComponent(paramMap.get("z") ?? "")
    if (time && timeZone) {
      this.update(time, timeZone)
    }
  }

  updateTimeZoneList(timeValue: Date) {
    const set = new Set<string>();
    for (const timeZone of this.timeZoneNames)
      set.add(this.formatTime(timeValue, timeZone))
    this.timeZoneList = Array.from(set).sort()
    const ourIndex = this.timeZoneList.indexOf(this.timeTextNorm)
    if (ourIndex > -1)
      this.timeZoneList = [
        ...this.timeZoneList.slice(ourIndex), // Make local time the top one
        ...this.timeZoneList.slice(0, ourIndex),
      ]
  }

  async copyLinkToClipboard() {
    const text = this.link
    try {
      const type = "text/plain";
      const blob = new Blob([text], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
    } catch (e) {
      document.execCommand("copy", false, text)
    }
    this.copyLinkText = "copied!"
  }
}
