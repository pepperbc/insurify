<template>
      <li class="row">
          <span class="time">{{departure.time}}</span>
          <span class="destination">{{departure.destination}}</span>
          <span class="train">MBTA {{departure.trainNum}}</span>
          <span class="track">{{departure.trackNum && "Track " + departure.trackNum}}</span>
          <span class="status" v-bind:class="[departure.onTime ? 'green' : 'red']">{{departure.status}}</span>
      </li>
</template>
<script>
  export default {
    name: 'DepartureBoardMobileRow',
    props: ['departure'],
  }
</script>
<style lang="scss" scoped>
    .row {
        font-size: 1em;
        padding: 1em 0.5em;
        display: grid;
        align-items: center;
        grid-row-gap: 0.1em;
        grid-template-columns: 6em minmax(0, 1fr) 4em;
        grid-template-rows: auto auto;
        grid-template-areas: 
        "time destination status"
        "time train track"
    }
    .time {
        grid-area: time;
        font-size: 1.2em;
        font-weight: 500;
        align-self: center;
    }
    .destination {
        margin-right: 0.3em;
        overflow: hidden;
        font-weight: 500;
        grid-area: destination;
    }
    .train {
        grid-area: train;
        font-size: 0.8em;
        color: #777;
    }
    .track {
        grid-area : track;
        font-size: 0.8em;
        color: #777;
    }
    .status {
        grid-area: status;
    }
</style>