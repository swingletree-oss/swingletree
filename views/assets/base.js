function relativeDate(timestamp) {
    var delta = Math.floor((Date.now() - timestamp) / 1000);

    if (delta < 30) {
        return delta + " seconds ago";
    } else if (delta < 60) {
        return "about a minute ago";
    } else {
        return Math.floor(delta / 60) + " minutes ago";
    }
}

$(function () {
    $("[x-relative-date]").each((i,e) => {
        e = $(e);
        e.html(relativeDate(e.attr("x-relative-date")));
    });

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover({content: $('#health-po-content').html(), html: true}) });
    $('[data-toggle="popover"]').on('shown.bs.popover', function () {
        
    })