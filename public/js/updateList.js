var timeout = 500;

function ajaxRequest() {
    $.ajax({
        url: "/samples"
    }).done(function(sampleList) {
        var list = sampleList.map(function(sample) {
            return '<li><small>' + sample + '</small></li>';
        });

        $('#sampleList').empty().append(list);
    });
}

$(document).on("ready", function(){
    setInterval(ajaxRequest, timeout);
});