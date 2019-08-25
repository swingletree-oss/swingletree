var app = new Vue({
  el: "#app",
  data () {
    return {
      orgs: null,
      builds: null
    }
  },
  mounted () {
    axios
      .get('../api/orgs')
      .then(response => {
        this.orgs = response.data
      })
      .catch(console.error);

    axios
      .get('../api/builds')
      .then(response => {
        this.builds = response.data.hits.map((item) => {
          return item._source;
        })
      })
      .catch(console.error);
  }
});