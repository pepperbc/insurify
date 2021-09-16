<template>
  <div>
    <h2 class="title">South Station Departures</h2>
    <ag-grid-vue
        style="width: 100%; max-width: 800px; height: 100%; margin: auto"
        class="desktop ag-theme-alpine"
        domLayout='autoHeight'
        :columnDefs="columnDefs"
        :rowData="departures"
        @grid-ready="onGridReady"        
        >
    </ag-grid-vue>
    <ul class="mobile">
      <DepartureBoardMobileRow v-for="departure in departures" v-bind:key="departure.trainNum" :departure="departure"/> 
    </ul>
  </div>
</template>

<script>
//Error handling
//Potential Improvements : Arrivals board, 
//If train didnt arrive but their is no prediction, it first appears to have departed, then disappears
//Better detection of when a train never arrived, Amtrak (re add carrier),
//Why is the track column so wide, merge mobile and standard grids
//North/South station switch
//Middleborough/Lakeville overflows on smaller phones
//1ad37a304e604660ac9df389adc1fa05 api key
  import moment from 'moment-timezone';
  import { AgGridVue } from 'ag-grid-vue3';
  import mbtaApi from '../mbtaApi';

  let refreshTime = 15 * 1000;//ms between refreshes
  let southStationId = 'place-sstat';
  //let northStationId = 'place-north';
  let commuterRailRouteType = 2;

  export default {
  name: 'DepartureBoard',
  components: {
      AgGridVue
    },
  data() {
    return {
      stationId : southStationId,
      refreshTimeoutId : null,
      columnDefs : [ 
                     { field: 'time', headerName: 'Time', sort: 'asc' },
                     { field: 'destination', headerName: 'Destination' },
                     { field: 'trainNum', headerName: 'Train' },
                     { field: 'trackNum', headerName: 'Track' },
                     { field: 'status' , headerName: 'Status', cellClassRules : { green: params => params.data.onTime, red: params => !params.data.onTime} }
                   ],
      departures : []
    }
  },
  errorCaptured(error) {
    console.log(error);//Display a message to user
  },
  async created() {
    this.fetchMbtaData();
  },
  unmounted() {
    clearTimeout(this.refreshTimeoutId)
  },
  methods: {
    onGridReady(params) {
      this.resizeColumns = params.api.sizeColumnsToFit.bind(params.api);
      this.resizeColumns();
      window.addEventListener('resize', this.resizeColumns);
    },
    async fetchMbtaData() {

      let commuter_rail_route_ids = (await mbtaApi.get('routes', {
        params: {
          fields: {
            route: 'id'
          },
          filter: { stop: this.stationId, //southStationId + ',' + northStationId
                    type: commuterRailRouteType,
          }
        }
      })).data.map(stop => stop.id);

      let schedules = await mbtaApi.get('schedules', {  
        params: {
          sort: 'departure_time',
          include: 'route,prediction,prediction.stop,trip',
          filter: { route: commuter_rail_route_ids.join(','),
                    stop: this.stationId,
                    //Edge cases around the day boundary (such as a delayed train arriving after 3am, or trains departing 3am-6am) should be fixed
                    date: moment().tz('America/New_York').subtract('3 hours').format('YYYY-MM-DD'),//MBTA days run from 3am to 3am
          }
        }
      });


      let filteredSchedules = schedules.data.filter(schedule => {
        //departure time < 2 hours in future and < 30 minutes in past
        return ((moment(schedule.departure_time).isBefore(moment().add(2, 'hours')) 
            && moment(schedule.departure_time).isAfter(moment().subtract(30, 'minutes'))
            //Departure time in past and we have a prediction - catches trains more than 30 minutes late
            || moment(schedule.departure_time).isBefore(moment()) && schedule.prediction.data)
           )
      });

      let rows = filteredSchedules.map(schedule => {
        let time = schedule.departure_time;
        let predictedTime = schedule.prediction.data && schedule.prediction.data.departure_time;
        let formattedTime = time && moment(time).format('h:mm A');
        let destination = schedule.trip.data.headsign;
        let status = schedule.prediction.data && schedule.prediction.data.status;
        if (!status && moment(time).isBefore(moment())) {
          status = "Departed";//Not 100% accurate: it's possible there is no prediction despite the train not having left - we should figure out a way around this 
        } else if (predictedTime && moment(predictedTime).diff(moment(time), 'minutes') > 1) {
          status = moment(predictedTime).format('h:mm A');
        } else {
          status = "On time";
        }
        let trackNum = schedule.prediction.data && schedule.prediction.data.stop.data.platform_code;
        if (!trackNum && moment(time).isAfter(moment())) {
          trackNum = "TBD";
        }

        return {
          direction : schedule.route.data.direction_names[schedule.direction_id],//Outbound/inbound - currently unused
          destination,
          carrier : "MBTA",//Unused unless Amtrak data becomes available
          time : formattedTime,
          trainNum: schedule.trip.data.name,
          trackNum: schedule.prediction.data && schedule.prediction.data.stop.data.platform_code,
          status,
          onTime : status == "On time" || status == "Departed" 
        }
      });

      this.departures = rows;

      this.refreshTimeoutId = setTimeout(this.fetchMbtaData, refreshTime);
    }
  }
}
</script>

<style scoped>
.title {
  text-align: center;
}
@media only screen and (max-width: 600px) {
  .desktop {
    display:none;
  }
}
@media only screen and (min-width: 601px) {
  .mobile {
    display:none;
  }
}
.desktop {
    width: 100%;
}
.mobile {
  width: 100%;
}
</style>
<style>
.green {
    color: green
}
.red {
    color: red
}
</style>
