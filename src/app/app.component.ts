import { Component, OnInit } from "@angular/core"
import { RouterOutlet } from "@angular/router"

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

  ngOnInit(): void {
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    this.timeZoneNames = Intl.supportedValuesOf("timeZone")
  }

  timeStringToDate(time: string): Date {
    const parts = time.split(":").map(p => p.trim())
    if (parts.length < 2 ||
        parts.some(p => isNaN(parseInt(p, 10))))
      return new Date(NaN)
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
    return location.protocol + "//" + location.hostname + "?t=" + this.timeTextNorm + "&z=UTC"
  }

  change(event: Event) {
    const value = (<HTMLInputElement>event.target).value
    this.timeText = value
    const time = this.timeValue = this.timeStringToDate(value)
    this.timeTextNorm = this.formatTime(time, this.timeZone)
    this.link = this.createLink()
    this.copyLinkText = "(copy link)"
    this.updateTimeZoneList()
  }

  updateTimeZoneList() {
    this.timeZoneList.length = 0
    for (const timeZone of this.timeZoneNames) {
      if (this.timeValue) {
        const val = this.formatTime(this.timeValue, timeZone)
        if (!this.timeZoneList.includes(val))
          this.timeZoneList.push(val)
      }
    }
    this.timeZoneList.sort()

    const ourIndex = this.timeZoneList.indexOf(this.timeTextNorm)
    if (ourIndex > -1)
      this.timeZoneList = [
        ...this.timeZoneList.slice(ourIndex),
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
