$(document).ready(function() {
  $(".code-select").find("a").click(function(event) {
    event.preventDefault();
    var codeCase = $(event.target).attr("data-case")
    // hide all
    $(".code-showcase").find("div").hide();

    $(".code-select").find(".nav-link").each(function(index, linkItem) {
      linkItem = $(linkItem);
      linkItem.toggleClass("active", codeCase == linkItem.attr("data-case"));
    });

    $(codeCase).show();
  });
});