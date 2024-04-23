import { Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  title = "timelink"
  timeValue = ""
  timeValueNorm = ""
  link = ""
  copyLinkText = "(copy link)"

  normalizeTimeString(time: string): string {
    const parts = time.split(":").map(p => p.trim())
    if (parts.length < 2)
      return "Invalid: Format it like the placeholder"
    if (parts.some(p => isNaN(parseInt(p, 10))))
      return "Invalid: You have alpha characters in there"
    if (parts.length == 2)
      parts.unshift("00")
    return parts.slice(0, 3)
      .map(p => p.padStart(2, "0"))
      .join("")
  }

  createLink(): string {
    return location.protocol + "//" + location.hostname + "?t=" + this.timeValueNorm + "&z=UTC"
  }

  change(event: Event) {
    const value = (<HTMLInputElement>event.target).value
    this.timeValue = value
    this.timeValueNorm = this.normalizeTimeString(value)
    this.link = this.createLink()
    this.copyLinkText = "(copy link)"
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
