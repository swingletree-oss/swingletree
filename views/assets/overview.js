var app = new Vue({
  el: "#app",
  data: {
    orgs: {},
    error: null
  },
  mounted: () => {
    var self = this;
    $.ajax({
      url: '../api/orgs',
      method: 'GET',
      success: (data) => {
        self.orgs = data;
      },
      error: (error) => {
        console.error(error);
        self.error = error;
      }
    });
  }
});