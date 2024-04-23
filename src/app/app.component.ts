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
  timeValue = "hello"

  change(event: Event) {
    this.timeValue = (<HTMLInputElement>event.target).value
  }
}
