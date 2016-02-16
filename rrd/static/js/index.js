//jQuery(function($) {
//    $(document).ready(function() {
//        $('.options').stickUp();
//    });
//});
$(document).ready(function() {

    var $selectScreen = $('#screenId');
    $.ajax({
        type : 'get',
        url : '/screen/data/cbscreens',
        dataType : 'json',
        success : function (jsonData) {
            if (jsonData.ok) {
                $.each(jsonData.data, function(i, item) {
                    var $option = $('<option value="' + item.id + '">' + item.name + '</option>');
                    $selectScreen.append($option);
                });
            } 
        },
        error : function () {},
    });
    $selectScreen.select2({
        placeholder : "快速选择机器和监控项",
        width : '75%',
    });
    $selectScreen.change(function () {
        $.ajax({
            type : 'get',
            url : '/screen/data/' + $(this).val(),
            dataType : 'json',
            success : function (jsonData) {
                if (jsonData.ok) {
                    var counters = jsonData.data[0].counters;
                    var endpoints = jsonData.data[0].endpoints;
                    var callback = function () {plot('AVERAGE', 'off');}

                    $('#endpoints').val(endpoints).trigger('change', [JSON.stringify(counters), callback]);
//                    $('#counters').val(counters).trigger('change');
//                    plot('AVERAGE', 'off');
//                    $('#endpoints').val(endpoints).trigger('change');
//                    setTimeout("$('#counters').val(counters).trigger('change'); plot('AVERAGE', 'off');", 1000);
                } 
            },
            error : function () {}
        });
    });
    initTimepicker(3600);
    $('#endpoints').select2({
        placeholder : "请选择机器",
        width : '120%',
        allowClear : true,
        tags : true,
    });
    $('#counters').select2({
        placeholder : "请选择监控项",
        width : '130%',
        allowClear : true,
        tags : true,
    });
    renderServices();
    $('#endpoints').change(function(event, counterValue, callback) {
        var data = {
            endpoints : $('#endpoints').val(),
            limit : 10000,
        };
        $.ajax({
            type : 'post',
            url : '/api/counters',
            data : data,
            dataType : 'json',
            success : function (jsonData) {
                var lastValue = $('#counters').val();
                if (jsonData.ok) {
                    var counters = jsonData.data;
                    var options = '';
                    $.each(counters, function(i, value) {
                        options += '<option value="' + value[0] + '">' + value[0] + '</option>';
                    })
                    $('#counters').html(options);
                    if (counterValue) {
                        lastValue = JSON.parse(counterValue);
                    }
                    if (callback) {
                        $('#counters').val(lastValue).trigger('change', callback);
                    } else {
                        $('#counters').val(lastValue).trigger('change');
                    }
                }
            },
            error : function () {},
        })
    });
    $('#counters').change(function(event, callback) {
        callback();
    });
    $('#submit').click(function() {
        plot('AVERAGE', 'off');
    });
    $('#toLatest').click(function() {
        toLatestTimepicker();
        plot('AVERAGE', 'off');
    });
    $('.selectTime').each(function() {
        $(this).click(function() {
            initTimepicker($(this).attr('data-value'));             
            plot('AVERAGE', 'off');
        });
    });
    $('#header').headroom({
        "offset" : 205,
        "tolerance" : 5,
        "classes" : {
            "initial" : "animated",
            "pinned" : "slideInDown",
            "unpinned" : "slideOutUp"
        }
    });
    $('#hideOptions').click(function () {
        $('#options').removeClass('slideInDown');
        $('#options').addClass('slideOutUp');
    });
    $('#showOptions').click(function () {
        $('#options').removeClass('slideOutUp');
        $('#options').addClass('slideInDown');
    });
})

function renderServices() {
    $.ajax({
        type : 'post',
        url : '/api/fake/getservices',
        dataType : 'json',
        success : function (jsonData) {
            if (jsonData.errno != 10000) {
            }

            $.each(jsonData.data, function(i, service) {
                $("#services").append("<button type='button' id='" + service + "' class='service btn btn-default btn-sm'>" + service + "</button");
                $('.service').each(function() {
                    $(this).click(function() {
                        onCheckService($(this).attr('id'));
                    });
                });
            })
        },
    })
}

function onCheckService(service) {
    $.ajax({
        type : 'post',
        url : '/api/fake/gethostsbyservice?serviceName=' + service,
        dataType : 'json',
        success : function (jsonData) {
            if (jsonData.errno != 10000) {
            
            }
            var hosts = $('#endpoints').val();

            if (hosts == null) {
                hosts = jsonData.data;
            } else {
                hosts = hosts.concat(jsonData.data);
            }

            $('#endpoints').val(hosts).trigger('change');
    
        },
    });
}

function plot(cf, sum) {
    
    var timestamp = Date.parse(new Date());
    var endpoints = $('#endpoints').val();
    var counters = $('#counters').val();
    var start = (new Date($('#startTime').val())).getTime() / 1000;
    var end = (new Date($('#endTime').val())).getTime() / 1000;
    
    var data = {
        _t : timestamp,
        counters : counters,
        endpoints : endpoints,
    };

    var id = 0;
    $.post('/chart', data, function(jsonData) {
        if (jsonData.ok) {
            id = jsonData.id;
        } 
        plotId(id, cf, sum, start, end, timestamp, counters);
    }, 'json');

}

function plotId(id, cf, sum, start, end, _t, counters) {
    var data = {
        _t : _t,
        cf : cf,
        sum : sum,
        id : id,
        start : start,
        end : end,
    };

    var charts = {};
    var chartIds = {};
    var $graphs = $('#graphs');
    $graphs.html('');

    $.each(counters, function(index, counter) {
        var html = '<div class="col-md-6"><div class="row"><div id="graph-' + index + '" class="col-md-12" style="height:400px;width:100%"></div></div><div class="row"><div class="col-offset-md-2 col-md-8" style="width:100%"><table class="table table-striped table-hover" id="legends-' + index + '"><thead><tr><td>机器名</td><td>当前值</td><td>最小值</td><td>最大值</td><td>平均值</td></tr></thead><tbody></tbody></table></div><div></div>';

        if (index % 2 == 0) {
            $graphs.append('<div class="row" id="graphRow-' + Math.floor(index / 2) + '"></div>');
        }

        $('#graphRow-' + Math.floor(index / 2)).append(html);
        var chart = echarts.init(document.getElementById('graph-' + index));
        chart.showLoading({ effect : 'spin' });
        charts[counter] = chart;
        chartIds[counter] = index;
    })

    $.ajax({
        type : 'get',
        url : '/chart/a',
        data : data,
        dataType : 'json',
        success : function(jsonData) {
            var mapSeries = {};
            $.each(jsonData.series, function(index, rawSerie) {
                if (typeof(mapSeries[rawSerie['counter']]) == 'undefined') {
                    mapSeries[rawSerie['counter']] = [];
                }
                mapSeries[rawSerie['counter']].push(rawSerie);
            });
            
            $.each(charts, function(counter, chart) {
                if (typeof(mapSeries[counter]) == 'undefined') {
                    chart.hideLoading();
                    return ;
                } 

                var legend = {
                    show : false,
                    x : 'center',
                    y : 'bottom',
                };
                legend['data'] = [];
                var series = [];
                var xAxis = [];
                var sum = {};
                var min = {};
                var max = {};
                var avg = {};
                var cur = {};

                $.each(mapSeries[counter], function(index, rawSerie) {
                    var endpoint = rawSerie.endpoint
                    var serie = {};
                    var data = [];

                    sum[endpoint] = 0;
                    min[endpoint] = rawSerie.data[0][1];
                    max[endpoint] = rawSerie.data[0][1];

                    legend['data'].push(rawSerie['endpoint']);
                    $.each(rawSerie.data, function(index, rawItem) {
                        if (rawItem[1] == null) {
                            return ;
                        }
                        var item = [new Date(rawItem[0]), rawItem[1]];
                        data.push(item);
                        sum[endpoint] += rawItem[1];
                        if (min[endpoint] > rawItem[1] || min[endpoint] == null) {
                            min[endpoint] = rawItem[1]; 
                        }
                        if (max[endpoint] < rawItem[1] || max[endpoint] == null) {
                            max[endpoint] = rawItem[1]
                        }
                        cur[endpoint] = rawItem[1];
                    });
                    if (typeof(cur[endpoint]) == 'undefined') {
                        cur[endpoint] = null;
                    }
                    avg[endpoint] = sum[endpoint] / rawSerie.data.length;
                    
                    serie.data = data;
                    serie.type = 'line';
                    serie.name = rawSerie['endpoint'];
                    serie.showAllSymbol = true;
                    serie.symbolSize = 0.1;
                    series.push(serie);
                });
                
                var option = { 
                    title : { 
                        show : true,
                        text : counter,
                    },  
                    tooltip : { 
                        trigger : 'item',
                        show : true,
                        formatter : function(params) {
                            var date = new Date(params.value[0]);
                            data = date.getFullYear() + '-' + (date.getMonth() + 1) 
                                + '-' + date.getDate() + ' ' + date.getHours() + ':'
                                + date.getMinutes();
                            return params.seriesName + '<br/>' + data + '<br/>' + params.value[1];
                        }   
                    },  
                    toolbox : { 
                        show : true,
                        feature : { 
                            dataView : {
                                show : true,
                                title : '数据视图',
                                readOnly: true,
                                lang : ['数据视图', '关闭', '刷新'],
                            },
                            saveAsImage : { 
                                show : true,
                                title : '保存为图片',
                                type : 'png',
                            },
                            restore : {
                                show : true,
                                title : '还原',
                            },
                        }   
                    },  
                    dataZoom : { 
                        show : true,
                        realtime : true,
                    },  
                    legend : legend,
                    xAxis : {
                        type : 'time',
                        splitNumber : 10,
                    },
                    yAxis : {
                        type : 'value',
                        splitNumber : 10,
                        scale : true,
                        axisLabel : {
                            formatter : function(val) {
                                var ret = 0;
                                var ruler = '';
                                if (val < 1024) {
                                    ret = val;
                                } else if (val < 1048576){
                                    ret = val / 1024;
                                    ruler = 'K';
                                } else if (val < 1073741824) {
                                    ret = val / 1048576;
                                    ruler = 'M';
                                } else if (val < 1099511627776) {
                                    ret = val / 1073741824;
                                    ruler = 'G';
                                } else {
                                    ret = val / 1099511627776;
                                    ruler = 'T';
                                }
                                return Number(ret).toFixed(2) + ruler;
                            }
                        },
                    },
                    series : series, 
                };   
                chart.setOption(option);

                var $legends = $('#legends-' + chartIds[counter] + ' tbody'); 
                if (typeof(chart.chart['line']) == 'undefined') {
                    return ; 
                }
                var legend = chart.chart['line'].component.legend;

                $(option.legend.data).each(function(i, l) {
                    var color = legend.getColor(l); 

                    var labelLegend = $('<tr class="legend"><td class="endpoint">' + l + '</label></td>' + 
                        '<td class="cur">' + (cur[l] == null ? null : cur[l].toFixed(2)) + '</td>' +
                        '<td class="min">' + (min[l] == null ? null : min[l].toFixed(2)) + '</td>' +
                        '<td class="max">' + (max[l] == null ? null : max[l].toFixed(2)) + '</td>' +
                        '<td class="avg">' + (avg[l] == null ? null : avg[l].toFixed(2)) + '</td>' +
                        '</tr>');
                    
                    labelLegend.css('color', color);
                    labelLegend.mouseover(function(){
                        labelLegend.css('font-weight', 'bold');
                    }).mouseout(function() {
                        labelLegend.css('font-weight', 'normal');
                    }).click(function(){
                        labelLegend.toggleClass('disabled');
                        legend.setSelected(l, !labelLegend.hasClass('disabled'));
                    });
                    $legends.append(labelLegend);
                })

                chart.hideLoading();

                $('#legends-' + chartIds[counter]).dataTable({
                    'dom' : 't<"bottom"p>',
                    'columns' : [
                        { 'type' : 'html' },
                        { 'type' : 'num' },
                        { 'type' : 'num' },
                        { 'type' : 'num' },
                        { 'type' : 'num' },
                    ]
                });
            });
        },
        error : function() { alert("没有数据"); },
    });

}

function toLatestTimepicker() {
    $('#endTime').val(dateFormat(new Date()));
    $('#endTime').datetimepicker({
        format: "yyyy-mm-dd hh:ii:ss",
        autoclose : true,
    }); 
}

function initTimepicker(period) {
    period *= 1000;

    var end = new Date();
    var begin = new Date(end - period);
    $('#startTime').val(dateFormat(begin));
    $('#endTime').val(dateFormat(end));
    $('#startTime').datetimepicker({ 
        format : "yyyy-mm-dd hh:ii:ss",
        autoclose : true,
    }); 
    $('#endTime').datetimepicker({
        format: "yyyy-mm-dd hh:ii:ss",
        autoclose : true,
    }); 

}

function dateFormat(datetime) {
    return datetime.getFullYear() + "-" + add0(datetime.getMonth() + 1) 
        + "-" + add0(datetime.getDate()) + " " 
        + add0(datetime.getHours()) + ":" + add0(datetime.getMinutes()) 
        + ":" + add0(datetime.getSeconds());
}

function add0(m) {
    return m < 10 ? '0' + m : m;
}
