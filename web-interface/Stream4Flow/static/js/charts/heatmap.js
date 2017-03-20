const SCALE_TYPES = {
    linear: d3.scale.linear(),
    log: d3.scale.log()
};

const DEFAULT_VALUES = {
    marginTop: 70,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 70,
    showLegend: true,
    showGrid: true,
    legendSteps: 10,
    cellSize: 5,
    colorMinimum: "#0f0",
    colorMaximum: "#f00",
    parentElement: "#chart",
    scaleType: SCALE_TYPES.linear
};

var data;
var xColumn, yColumn, value;

var parentElement;

var margin;
var showLegend, showGrid;
var cellSize;
var legendSteps, legendElementSize, legendOffset, legendTextOffset;
var width, height;
var rows, columns, originalRows, originalColumns, rowNum, colNum;
var sortOrder;
var colors;
var scaleType;
var zoom;

var initHeatmap = function(json, fields, options) {
    const defaultOptions = Object.assign({}, DEFAULT_VALUES);
    const parameters = Object.assign(defaultOptions, options);

    parentElement = parameters.parentElement;

    margin = {
        top: parameters.marginTop,
        right: parameters.marginRight,
        bottom: parameters.marginBottom,
        left: parameters.marginLeft
    };
    showLegend = parameters.showLegend;
    showGrid = parameters.showGrid;
    legendSteps = parameters.legendSteps;
    cellSize = parameters.cellSize;
    legendElementSize = {width: 2 * cellSize * 10, height: cellSize * 5};
    legendOffset = cellSize * 4;
    legendTextOffset = legendOffset * 2 + legendElementSize.height;
    sortOrder = {row: -1, col: -1};
    colors = {min: parameters.colorMinimum, max: parameters.colorMaximum};
    scaleType = parameters.scaleType;
    zoom = d3.behavior.zoom();

    margin.bottom += (showLegend ? (legendElementSize.height + legendOffset + cellSize) : 0);

    xColumn = fields.xColumn;
    yColumn = fields.yColumn;
    value = fields.value;

    data = loadData(json);

    draw(data, parentElement);
}

var loadData = function(json) {
    return json;
}

var redraw = function() {
    d3.select("#graphContainer").remove();
    draw(data, parentElement);
}

var getOtherFields = function() {
    return arrayDifference(Object.getOwnPropertyNames(data[0]), [xColumn, yColumn, value]);
}

var setValueField = function(valueField) {
    value = valueField;
    redraw();
}

var toggleGrid = function() {
    showGrid = !showGrid;
    redraw();
}

var toggleLegend = function() {
    showLegend = !showLegend;
    redraw();
}

var setColorScheme = function(minColor, maxColor) {
    colors.min = minColor;
    colors.max = maxColor;
    redraw();
}

var draw = function(data, parentElement) {
    rows = d3.map(data, function (d) {
        return d[yColumn];
    }).keys();
    columns = d3.map(data, function (d) {
        return d[xColumn];
    }).keys();
    originalRows = rows;
    originalColumns = columns;

    rowNum = rows.length;
    colNum = columns.length;

    width = cellSize * colNum;
    height = cellSize * rowNum;

    var tooltip = d3.select("body")
            .append("div")
            .attr("id", "tooltip")
            .attr("class", "heatmap hidden")
            .append("p")
            .append("span")
            .attr("id", "value")
        ;

    var colorScale = scaleType
            .domain(d3.extent(data, function (d) {
                return d[value];
            }))
            .interpolate(d3.interpolateHcl)
            .range([colors.min, colors.max])
        ;

    var svg = d3.select(parentElement)
            .append("svg")
            .attr("id", "graphContainer")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

    var graph = svg
            .append("g")
            .attr("id", "graph")
            .attr("class", "heatmap")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;

    //clip paths
    var clips = graph.append("g")
            .attr("id", "clips")
        ;

    clips.append("clipPath")
        .attr("id", "rowRect")
        .append("rect")
        .attr("x", -margin.left)
        .attr("y", "0")
        .attr("width", margin.left)
        .attr("height", height)
    ;

    clips.append("clipPath")
        .attr("id", "colRect")
        .append("rect")
        .attr("x", "0")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top)
    ;

    clips.append("clipPath")
        .attr("id", "graphRect")
        .append("rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", width + 1)
        .attr("height", height + 1)
    ;

    //y axis
    var rowG = graph.append("g")
            .attr("clip-path", "url(#rowRect)")
            .append("g")
            .attr("id", "rowGr")
            .attr("transform", "translate(-6, " + cellSize + ")")
        ;

    var rowLabels = rowG.append("g")
        .attr("id", "rows")
        .selectAll(".rowLabelg")
        .data(rows)
        .enter()
        .append("text")
        .text(function (d) {
            return d;
        })
        .attr("x", 0)
        .attr("y", function (d, i) {
            return i * cellSize;
        })
        .style("text-anchor", "end")
        .attr("class", function (d, i) {
            return "rowLabel mono r" + i;
        })
        .on("mouseover", function (d) {
            d3.select(this).classed("text-hover", true);
        })
        .on("mouseout", function (d) {
            d3.select(this).classed("text-hover", false);
        })
        .on("click", function (d) {
            var index = originalRows.indexOf("" + d);
            sortByLabel(true, index, (sortOrder.row != index));
            if (sortOrder.row == index) {
                sortOrder.row = -1;
            } else {
                sortOrder.row = index;
                sortOrder.col = -1;
            }
        });

    //x axis
    var colG = graph.append("g")
            .attr("clip-path", "url(#colRect)")
            .append("g")
            .attr("id", "colGr")
            .attr("transform", "translate(" + cellSize + ", -6) rotate (-90)")
        ;

    var colLabels = colG.append("g")
        .attr("id", "columns")
        .selectAll(".colLabelg")
        .data(columns)
        .enter()
        .append("text")
        .text(function (d) {
            return d;
        })
        .attr("x", 0)
        .attr("y", function (d, i) {
            return i * cellSize;
        })
        .style("text-anchor", "left")
        .attr("class", function (d, i) {
            return "colLabel mono c" + i;
        })
        .on("mouseover", function (d) {
            d3.select(this).classed("text-hover", true);
        })
        .on("mouseout", function (d) {
            d3.select(this).classed("text-hover", false);
        })
        .on("click", function (d) {
            var index = originalColumns.indexOf("" + d);
            sortByLabel(false, index, (sortOrder.col != index));
            if(sortOrder.col == index) {
                sortOrder.col = -1;
            } else {
                sortOrder.col = index;
                sortOrder.row = -1;
            }
        });

    //heatmap
    var heatmap = graph.append("g")
            .attr("clip-path", "url(#graphRect)")
            .append("g")
            .attr("id", "heatmap")
        ;

    heatmap.append("g")
        .attr("id", "cells")
        .selectAll(".cellg")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return columns.indexOf("" + d[xColumn]) * cellSize;
        })
        .attr("y", function (d) {
            return rows.indexOf("" + d[yColumn]) * cellSize;
        })
        .attr("class", function (d) {
            return "cell cc" + columns.indexOf("" + d[xColumn]) + " cr" + rows.indexOf("" + d[yColumn]);
        })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", function (d) {
            return colorScale(d[value]);
        })
        .on("mouseover", function (d) {
            //highlight text
            d3.select(".c" + originalColumns.indexOf("" + d[xColumn])).classed("text-highlight", true);
            d3.select(".r" + originalRows.indexOf("" + d[yColumn])).classed("text-highlight", true);

            //highlight cell
            d3.select(".highlight")
                .attr("transform", "translate(" + (columns.indexOf("" + d[xColumn]) * cellSize) + ", " + (rows.indexOf("" + d[yColumn]) * cellSize) + ")")
                .classed("hidden", false)
            ;

            //update the tooltip position and value
            d3.select("#tooltip")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 10) + "px")
                .select("#value")
                .text(tooltipText(d));

            //show the tooltip
            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function () {
            d3.selectAll(".rowLabel").classed("text-highlight", false);
            d3.selectAll(".colLabel").classed("text-highlight", false);

            d3.select("#tooltip").classed("hidden", true);

            d3.select(".highlight")
                .classed("hidden", true)
            ;
        })
    ;

    //grid
    if (showGrid) {
        var grid = heatmap.append("g")
                .attr("id", "grid")
                .attr("class", "grid")
            ;

        grid.selectAll(".gridx")
            .data(columns)
            .enter()
            .append("line")
            .attr("x1", function (d, i) {
                return i * cellSize;
            })
            .attr("y1", "0")
            .attr("x2", function (d, i) {
                return i * cellSize;
            })
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.append("line")
            .attr("x1", width)
            .attr("y1", "0")
            .attr("x2", width)
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.selectAll(".gridy")
            .data(rows)
            .enter()
            .append("line")
            .attr("x1", "0")
            .attr("y1", function (d, i) {
                return i * cellSize;
            })
            .attr("x2", width)
            .attr("y2", function (d, i) {
                return i * cellSize;
            })
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.append("line")
            .attr("x1", "0")
            .attr("y1", height)
            .attr("x2", width)
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;
    }

    //cell highlight element
    var highlight = heatmap.append("g")
            .attr("id", "highlight")
            .attr("class", "highlight")
            .classed("hidden", true)
        ;

    highlight.append("line")
        .attr("class", "highlightLine")
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", cellSize)
        .attr("y2", "0")
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("class", "highlightLine")
        .attr("x1", cellSize)
        .attr("y1", "0")
        .attr("x2", cellSize)
        .attr("y2", cellSize)
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("class", "highlightLine")
        .attr("x1", cellSize)
        .attr("y1", cellSize)
        .attr("x2", "0")
        .attr("y2", cellSize)
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("class", "highlightLine")
        .attr("x1", "0")
        .attr("y1", cellSize)
        .attr("x2", "0")
        .attr("y2", "0")
        .attr("vector-effect", "non-scaling-stroke")
    ;

    //legend
    if (showLegend) {
        var legend = graph.append("g")
            .attr("id", "leg")
            .selectAll(".legend")
            .data(range(colorScale.domain()[0], colorScale.domain()[1], legendSteps))
            .enter().append("g")
            .attr("class", "legend");

        legend.append("rect")
            .attr("x", function (d, i) {
                return legendElementSize.width * i;
            })
            .attr("y", height + legendOffset)
            .attr("width", legendElementSize.width)
            .attr("height", legendElementSize.height)
            .attr("class", "legend-border")
            .style("fill", colorScale);

        legend.append("text")
            .attr("class", "legend")
            .text(function (d) {
                return d;
            })
            .attr("width", legendElementSize.width)
            .attr("x", function (d, i) {
                return legendElementSize.width * i;
            })
            .attr("y", height + legendTextOffset);
    }

    //attach zoom to the canvas
    zoom.scaleExtent([1, 7]).on("zoom", zoomed);
    svg.call(zoom);

    //zoom handler
    function zoomed() {
        var e = d3.event,
            tx = Math.min(0, Math.max(e.translate[0], width - width * e.scale)),
            ty = Math.min(0, Math.max(e.translate[1], height - height * e.scale));

        zoom.translate([tx, ty]);

        heatmap.attr("transform", "translate(" + [tx, ty] + ") scale(" + zoom.scale() + ")");
        rowLabels.attr("transform", "translate(0, " + ty + ") scale(" + zoom.scale() + ")");
        colLabels.attr("transform", "translate(0, " + tx + ") scale(" + zoom.scale() + ")");
        rowG.attr("transform", "translate(-6, " + cellSize * zoom.scale() + ")");
        colG.attr("transform", "translate(" + cellSize * zoom.scale() + ", -6) rotate (-90)");

        // d3.select(".grid").style("stroke-width", 1/zoom.scale() + "px");
        // d3.select(".highlight").style("stroke-width", 1/zoom.scale() + "px");
    }

    //sort
    function sortByLabel(isRow, index, sortOrder) {
        var t = svg.transition().duration(0);
        var byValue = [];
        for(var i = 0; i < (isRow ? colNum : rowNum); i++) {
            byValue.push((sortOrder ? -Infinity : Infinity));
        }
        var sorted;
        d3.selectAll(".c" + (isRow ? "r" : "c") + index)
            .filter(isRow
                ? function (ce) {
                    byValue[columns.indexOf("" + ce[xColumn])] = ce[value];
                }
                : function (ce) {
                    byValue[rows.indexOf("" + ce[yColumn])] = ce[value];
                }
            )
        ;
        if(isRow) {
            sorted = d3.range(colNum).sort(function (a, b) {
                if(sortOrder) {
                    return byValue[b] - byValue[a];
                } else {
                    return byValue[a] - byValue[b];
                }
            });
            t.selectAll(".cell")
                .attr("x", function (d) {
                    return sorted.indexOf(columns.indexOf("" + d[xColumn])) * cellSize;
                })
            ;
            t.selectAll(".colLabel")
                .attr("y", function (d) {
                    return sorted.indexOf(columns.indexOf(d)) * cellSize;
                })
            ;
            var newColumns = [];
            for(var i = 0; i < sorted.length; i++) {
                newColumns.push(columns[sorted[i]]);
            }
            columns = newColumns;
        } else {
            sorted = d3.range(rowNum).sort(function (a, b) {
                if(sortOrder) {
                    return byValue[b] - byValue[a];
                } else {
                    return byValue[a] - byValue[b];
                }
            });
            t.selectAll(".cell")
                .attr("y", function (d) {
                    return sorted.indexOf(rows.indexOf("" + d[yColumn])) * cellSize;
                })
            ;
            t.selectAll(".rowLabel")
                .attr("y", function (d) {
                    return sorted.indexOf(rows.indexOf(d)) * cellSize;
                })
            ;
            var newRows = [];
            for(var i = 0; i < sorted.length; i++) {
                newRows.push(rows[sorted[i]]);
            }
            rows = newRows;
        }
    }
}

var arrayDifference = function(a1, a2) {
    return a1.filter(function(x) { return a2.indexOf(x) < 0 });
}

//helper function for the legend
var range = function(start, end, steps) {
    var a = [];
    a.push(start);

    if(scaleType === SCALE_TYPES.linear) {
        var s = Math.trunc((end - start) / steps);

        for(var i = 2; i < steps; i++) {
            a.push(start + (i - 1) * s);
        }
    }

    if(scaleType === SCALE_TYPES.log) {
        var startLog = Math.log(start);
        var endLog = Math.log(end);

        s = (endLog - startLog) / (steps - 1);

        for(var i = 2; i < steps; i++) {
            a.push(Math.trunc(Math.pow(Math.E, (i - 1) * s)));
        }
    }

    a.push(end);
    return a;
}

var tooltipText = function(d) {
    var headers = arrayDifference(Object.getOwnPropertyNames(data[0]), [xColumn, yColumn, value]);
    var s = "x: " + d[xColumn] + ", y: " + d[yColumn] + "\n" + value + ": " + d[value];

    for(var i = 0; i < headers.length; i++) {
        s += "\n" + headers[i] + ": " + d[headers[i]];
    }

    return s;
};