(function () {
  let template = document.createElement("template");
  template.innerHTML = `
	 <style>

		.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
		}

		.calendar {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			grid-gap: 2px; 
			text-align: center;
			position: relative;
            			z-index: 1;
		}

		.day {
			border: 1px solid #ddd; 
			display: flex;
			flex-direction: column;
			position: relative;
			height: 150px;
			z-index: 1;
		}

		.day-number {
			font-weight: bold;
			font-size: 14px;
			height: 25px;
			background-color: #f0f0f0;
		}

		.event-space {
			flex-grow: 1;
			background-color: #fafafa;
			
			position: relative;
			z-index: 5;
		}

		.event-item {
			position: absolute;
			margin: 0; 
			padding: 5px;
			background-color: #e0f7fa;
			font-size: 12px;
			height: 12px;
			text-overflow: ellipsis;
			white-space: nowrap;
			z-index: 10;
		}

		.event-item.continuous {
        			border-radius: 0px;
			width: 100% ; 
			background-color: #b3e5fc; 
            			z-index: 10;
                          position: absolute;
                          

		}

		.day-header {
			font-weight: bold;
			background-color: #f0f0f0;
			padding: 5px;
		}

		select {
			padding: 5px;
			font-size: 14px;
		}

		</style>

		<div class="header">
			<select id="monthSelect">
				<option value="0">January</option>
				<option value="1">February</option>
				<option value="2">March</option>
				<option value="3">April</option>
				<option value="4">May</option>
				<option value="5">June</option>
				<option value="6">July</option>
				<option value="7">August</option>
				<option value="8">September</option>
				<option value="9">October</option>
				<option value="10">November</option>
				<option value="11">December</option>
			</select>
			<select id="yearSelect"></select>
		</div>

		<div class="calendar">
			<div class="day-header">Mon</div>
			<div class="day-header">Tue</div>
			<div class="day-header">Wed</div>
			<div class="day-header">Thu</div>
			<div class="day-header">Fri</div>
			<div class="day-header">Sat</div>
			<div class="day-header">Sun</div>
		</div>
	`;

  class ColoredBox extends HTMLElement {
    constructor() {
      super();
      let shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(true));

      this.currentYear = new Date().getFullYear();
      this.currentMonth = new Date().getMonth();

      this.render();
    }

    async render() {
      if (!this._myDataSource || this._myDataSource.state !== "success") {
        return;
      } else {
        const startTimestamp =
          this._myDataSource.metadata.feeds.dimensions.values[0];
        const endTimestamp =
          this._myDataSource.metadata.feeds.dimensions.values[1];
        const event = this._myDataSource.metadata.feeds.dimensions.values[2];
        const data = this._myDataSource.data.map((data) => {
          return {
            startDate: new Date(
              data[startTimestamp].label.replace(
                /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/,
                "$4:$5:$6 $2/$3/$1"
              )
            ),
            endDate: new Date(
              data[endTimestamp].label.replace(
                /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/,
                "$4:$5:$6 $2/$3/$1"
              )
            ),
            event: data[event].label,
          };
        });

        this.events = data;
      }

      this.renderYearOptions();
      this.renderCalendar();

      this.shadowRoot.getElementById("monthSelect").value = this.currentMonth;
      this.shadowRoot
        .getElementById("yearSelect")
        .addEventListener("change", (event) => {
          this.currentYear = parseInt(event.target.value);
          this.renderCalendar();
        });

      this.shadowRoot
        .getElementById("monthSelect")
        .addEventListener("change", (event) => {
          this.currentMonth = parseInt(event.target.value);
          this.renderCalendar();
        });
    }

    set myDataSource(dataBinding) {
      this._myDataSource = dataBinding;
      this.render();
    }

    renderYearOptions() {
      let yearSelect = this.shadowRoot.getElementById("yearSelect");
      let currentYear = new Date().getFullYear();

      for (let i = currentYear - 50; i <= currentYear + 50; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.text = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }

    daysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    renderCalendar() {
      let calendar = this.shadowRoot.querySelector(".calendar");
      calendar.innerHTML = `
				<div class="day-header">Mon</div>
				<div class="day-header">Tue</div>
				<div class="day-header">Wed</div>
				<div class="day-header">Thu</div>
				<div class="day-header">Fri</div>
				<div class="day-header">Sat</div>
				<div class="day-header">Sun</div>
			`;

      let daysInMonth = this.daysInMonth(this.currentYear, this.currentMonth);
      let firstDayOfMonth = new Date(
        this.currentYear,
        this.currentMonth,
        1
      ).getDay();
      let adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

      this.events.forEach(function (element) {
        element.position = null;
        element.hidden = false;
      });

      for (let i = 0; i < adjustedFirstDay; i++) {
        let emptyCell = document.createElement("div");
        emptyCell.classList.add("empty-cell");
        calendar.appendChild(emptyCell);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        var y = 0;
        var z = 0;

        let dayElement = document.createElement("div");
        dayElement.className = "day";

        let dayNumber = document.createElement("div");
        dayNumber.className = "day-number";
        dayNumber.textContent = i;

        let eventSpace = document.createElement("div");
        eventSpace.className = "event-space";

        let eventsForDay = this.events.filter((event) => {
          let eventStartDate = new Date(
            new Date(event.startDate).toDateString()
          );
          let eventEndDate = new Date(new Date(event.endDate).toDateString());
          let dayDate = new Date(this.currentYear, this.currentMonth, i);
          return (
            eventStartDate <= dayDate &&
            eventEndDate >= dayDate &&
            event.hidden == false
          );
        });

        let dayDate = new Date(this.currentYear, this.currentMonth, i);

        let l = 0;

        eventsForDay.forEach((event) => {});

        eventsForDay.forEach((event) => {
          if (event.position != null) {
            [eventsForDay[z], eventsForDay[event.position]] = [
              eventsForDay[event.position],
              eventsForDay[z],
            ];
          }
          if (event.position == null) {
            event.position = z;
          }
          z++;
        });

        eventsForDay.forEach((event) => {
          l++;

          if (typeof event == "undefined") {
            return;
          }

          if (l > 4) {
            event.hidden = true;
            return;
          } else if (event.hidden == true) {
            return;
          }

          let eventItem = document.createElement("div");
          eventItem.className = "event-item";

          let eventStartDate = new Date(event.startDate);
          let eventEndDate = new Date(event.endDate);

          let startHour = eventStartDate.getHours();
          let endHour = eventEndDate.getHours();
          let totalHours = 24;
          let hourHeight = 100 / totalHours;

          if (eventStartDate.toDateString() !== eventEndDate.toDateString()) {
            eventItem.classList.add("continuous");

            if (
              24 - startHour >= endHour &&
              this.convertMiliseconds(
                new Date(eventEndDate.toDateString()).getTime() -
                  new Date(eventStartDate.toDateString()).getTime(),
                "d"
              ) <= 1 &&
              eventStartDate.getDate() == dayDate.getDate()
            ) {
              eventItem.textContent = event.event;
            } else if (
              24 - startHour < endHour &&
              this.convertMiliseconds(
                new Date(eventEndDate.toDateString()).getTime() -
                  new Date(eventStartDate.toDateString()).getTime(),
                "d"
              ) <= 1 &&
              eventEndDate.getDate() == dayDate.getDate()
            ) {
              eventItem.textContent = event.event;
            } else if (
              eventStartDate.getDate() + 1 == dayDate.getDate() &&
              this.convertMiliseconds(
                new Date(eventEndDate.toDateString()).getTime() -
                  new Date(eventStartDate.toDateString()).getTime(),
                "d"
              ) > 1
            ) {
              eventItem.textContent = event.event;
            } else if (
              dayDate.getMonth() != eventStartDate.getMonth() &&
              dayDate.getDate() == 1
            ) {
              eventItem.textContent = event.event;
            }

            if (eventEndDate.getDate() == i) {
              eventItem.style.width = `${endHour * hourHeight}%`;
            }

            if (eventStartDate.getDate() == i) {
              eventItem.style.width = `${(24 - startHour) * hourHeight}%`;
              eventItem.style.left = `${startHour * hourHeight}%`;
            }

            eventSpace.appendChild(eventItem);
          } else {
            eventItem.style.width = `${(endHour - startHour) * hourHeight}%`;
            eventItem.style.left = `${startHour * hourHeight}%`;
            eventItem.style.flexDirection = "row-reverse";

            eventItem.textContent = event.event;
            eventSpace.appendChild(eventItem);
          }

          if (event.position !== 0) {
            eventItem.style.top = `${event.position * 30}px`;
          } else {
            eventItem.style.top = `${eventsForDay.indexOf(event) * 30}px`;
          }
        });

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(eventSpace);
        calendar.appendChild(dayElement);
      }
    }

    setData(events) {
      this.events = events;
      this.renderCalendar();
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if (changedProperties.events) {
        this.setData(changedProperties.events);
      }
      if (changedProperties.maxEvents) {
        this.maxEvents = parseInt(changedProperties.maxEvents);
        this.renderCalendar();
      }
    }

    convertMiliseconds(miliseconds, format) {
      var days,
        hours,
        minutes,
        seconds,
        total_hours,
        total_minutes,
        total_seconds;

      total_seconds = parseInt(Math.floor(miliseconds / 1000));
      total_minutes = parseInt(Math.floor(total_seconds / 60));
      total_hours = parseInt(Math.floor(total_minutes / 60));
      days = parseInt(Math.floor(total_hours / 24));

      seconds = parseInt(total_seconds % 60);
      minutes = parseInt(total_minutes % 60);
      hours = parseInt(total_hours % 24);

      switch (format) {
        case "s":
          return total_seconds;
        case "m":
          return total_minutes;
        case "h":
          return total_hours;
        case "d":
          return days;
        default:
          return { d: days, h: hours, m: minutes, s: seconds };
      }
    }
  }

  customElements.define("dev-event-calendar", ColoredBox);
})();
