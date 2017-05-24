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
    legendSteps: 12,
    cellSize: 5,
    colorMinimum: "#0f0",
    colorMaximum: "#f00",
    parentElement: "#chart",
    scaleType: SCALE_TYPES.linear,
    tooltipText: {
        format: "",
        values: []
    },
    sliderValues: [0, 100],
    axisRange: { //only works if the axis labels are whole numbers, use with precaution
        x: [-Infinity, Infinity],
        y: [-Infinity, Infinity]
    },
    cellRange: { //only works if the axis labels are whole numbers, use with precaution
        x: [-Infinity, Infinity],
        y: [-Infinity, Infinity]
    },
    cidr: ""
};

const DEFAULT_STYLE = {
    TEXT: {
        "font-family": "Consolas, courier",
        "fill": "#aaa"
    },
    LEGEND: {
        border: {
            "stroke": "#000",
            "stroke-width": "1px"
        },
        text: {
            "font-size": "14pt",
            "fill": "#000"
        }
    },
    GRID: {
        "fill": "none",
        "shape-rendering": "crispEdges",
        "stroke": "#eee",
        "stroke-width": "1px"
    },
    AXIS: {
        text: {
            "font-size": "4pt",
            "fill": "#aaa"
        },
        textHover: {
            "fill": "#00C"
        },
        textHighlight: {
            "fill": "#c00"
        }
    },
    TOOLTIP: {
        "position": "absolute",
        "width": "150px",
        "height": "auto",
        "padding": "10px",
        "background-color": "rgba(255, 255, 255, 0.8)",
        "border": "2px solid rgba(204, 0, 0, 0.8)",
        "-webkit-border-radius": "10px",
        "-moz-border-radius": "10px",
        "border-radius": "10px",
        "-webkit-box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "-moz-box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "pointer-events": "none",
        "margin": "0",
        "font-family": "Consolas, courier",
        "font-size": "14px",
        "line-height": "20px",
        "display": "none"
    },
    HIGHLIGHT: {
        "fill": "none",
        "shape-rendering": "crispEdges",
        "stroke": "#c00",
        "stroke-width": "1px",
        "display": "none"
    }
};

class D3heatmap {
    constructor(json, fields, options, styles) {
        const defaultOptions = Object.assign({}, DEFAULT_VALUES);

        //TODO: check option corectness

        const parameters = Object.assign(defaultOptions, options);

        const defaultStyle = Object.assign({}, DEFAULT_STYLE);
        this.style = Object.assign(defaultStyle, styles);

        this.parentElement = addHash(parameters.parentElement);

        this.margin = {
            top: parameters.marginTop,
            right: parameters.marginRight,
            bottom: parameters.marginBottom,
            left: parameters.marginLeft
        };
        this.showLegend = parameters.showLegend;
        this.showGrid = parameters.showGrid;
        this.legendSteps = parameters.legendSteps;
        this.cellSize = parameters.cellSize;
        this.legendElementSize = {width: this.cellSize * 12.58, height: this.cellSize * 4};
        this.legendOffset = this.cellSize * 2.5;
        this.legendTextOffset = this.legendOffset * 2.4 + this.legendElementSize.height;
        this.sortOrder = {xAxis: -1, yAxis: -1};
        this.colors = {min: addHash(parameters.colorMinimum), max: addHash(parameters.colorMaximum)};
        this.scaleType = parameters.scaleType;
        this.tooltipText = {format: parameters.tooltipText.format, values: parameters.tooltipText.values};
        this.axisRange = {x: parameters.axisRange.x, y: parameters.axisRange.y};
        this.cellRange = {x: parameters.cellRange.x, y: parameters.cellRange.y};
        this.cidr = parameters.cidr;
        this.zoom = d3.behavior.zoom();
        this.sliderValues = parameters.sliderValues;

        this.margin.bottom += (this.showLegend ? (this.legendElementSize.height + this.legendOffset + this.cellSize) : 0);

        this.xColumn = fields.xColumn;
        this.yColumn = fields.yColumn;
        this.value = fields.value;

        this.data = json;

        this.draw(this.data, this.parentElement, false);
    }

    loadData(json) {
        return JSON.parse(json);
    }

    redraw() {
        //d3.select("#graphContainer").remove();
        d3.select(this.parentElement).html(null);
        this.draw(this.data, this.parentElement, true);
    }

    setData(data) {
        this.data = data;
        this.redraw();
    }

    getOtherFields() {
        return arrayDifference(Object.getOwnPropertyNames(this.data[0]), [this.xColumn, this.yColumn, this.value]);
    }

    setValueField(valueField) {
        this.value = valueField;
        this.redraw();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.redraw();
    }

    toggleLegend() {
        this.showLegend = !this.showLegend;
        this.redraw();
    }

    setColorScheme(minColor, maxColor) {
        this.colors.min = minColor;
        this.colors.max = maxColor;
        this.redraw();
    }

    draw(data, parentElement, isRedraw) {
        var scope = this;

        if (!(this.cidr.length === 0)) {
            var c = parseCIDR(this.cidr);
            var c0 = c[0].split(".");
            var c1 = c[1].split(".");

            this.cellRange.x = [c0[2], c1[2]];
            this.cellRange.y = [c0[3], c1[3]];
        }

        if (this.axisRange.y[0] === -Infinity && this.axisRange.y[1] === Infinity) {
            this.yAxisLabelStrings = d3.map(data, function (d) {
                return d[scope.yColumn];
            }).keys();
        } else {
            this.yAxisLabelStrings = [];
            for (var i = this.axisRange.y[0]; i <= this.axisRange.y[1]; i++) {
                this.yAxisLabelStrings.push("" + i);
            }
        }

        if (this.axisRange.x[0] === -Infinity && this.axisRange.x[1] === Infinity) {
            this.xAxisLabelStrings = d3.map(data, function (d) {
                return d[scope.xColumn];
            }).keys();
        } else {
            this.xAxisLabelStrings = [];
            for (var i = this.axisRange.x[0]; i <= this.axisRange.x[1]; i++) {
                this.xAxisLabelStrings.push("" + i);
            }
        }

        var originalYAxisLabelStrings = this.yAxisLabelStrings;
        var originalXAxisLabelStrings = this.xAxisLabelStrings;

        this.yAxisCount = this.yAxisLabelStrings.length;
        this.xAxisCount = this.xAxisLabelStrings.length;

        this.width = this.cellSize * this.xAxisCount;
        this.height = this.cellSize * this.yAxisCount;

        var tooltip = d3.select("body")
                .append("div")
                .attr("id", scope.getTooltipId())
                .style(scope.style.TOOLTIP)
                .append("p")
                .append("span")
                .attr("id", "value")
            ;

        var colorScale = this.scaleType
                .domain(d3.extent(data.filter(function (x) {
                    return scope.isInRange(x);
                }), function (d) {
                    return d[scope.value];
                }))
                .interpolate(d3.interpolateHcl)
                .range([scope.colors.min, scope.colors.max])
            ;

        var svg = d3.select(parentElement)
                .append("svg")
                .attr("id", "graphContainer")
                .attr("width", scope.width + scope.margin.left + scope.margin.right)
                .attr("height", scope.height + scope.margin.top + scope.margin.bottom)
            ;



        var graph = svg
                .append("g")
                .attr("id", "graph")
                .attr("transform", "translate(" + scope.margin.left + "," + scope.margin.top + ")")
            ;

        //clip paths
        var clippingPaths = graph.append("g")
                .attr("id", "clippingPaths")
            ;

        clippingPaths.append("clipPath")
            .attr("id", "yAxisClip")
            .append("rect")
            .attr("x", -scope.margin.left)
            .attr("y", "0")
            .attr("width", scope.margin.left)
            .attr("height", scope.height)
        ;

        clippingPaths.append("clipPath")
            .attr("id", "xAxisClip")
            .append("rect")
            .attr("x", "0")
            .attr("y", -scope.margin.top)
            .attr("width", scope.width)
            .attr("height", scope.margin.top)
        ;

        clippingPaths.append("clipPath")
            .attr("id", "graphRect")
            .append("rect")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", scope.width + 1)
            .attr("height", scope.height + 1)
        ;

        //y axis
        var yAxis = graph.append("g")
                .attr("clip-path", "url(#yAxisClip)")
                .append("g")
                .attr("id", "yAxisGroup")
                .attr("transform", "translate(-6, " + scope.cellSize + ")")
            ;

        var yAxisLabels = yAxis.append("g")
            .attr("id", "yAxisLabels")
            .selectAll(".yAxisLabel")
            .data(scope.yAxisLabelStrings)
            .enter()
            .append("text")
            .style(scope.style.TEXT)
            .style(scope.style.AXIS.text)
            .text(function (d) {
                return d;
            })
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * scope.cellSize;
            })
            .style("text-anchor", "end")
            .attr("class", function (d, i) {
                return "yAxisLabel y-" + scope.getGraphName() + "-" + i;
            })
            .on("mouseover", function (d) {
                d3.select(this).style(scope.style.AXIS.textHover);
            })
            .on("mouseout", function (d) {
                d3.select(this).style(scope.style.AXIS.text);
            })
            .on("click", function (d) {
                var index = originalYAxisLabelStrings.indexOf("" + d);
                sortByLabel(true, index, (scope.sortOrder.yAxis != index));
                if (scope.sortOrder.yAxis == index) {
                    scope.sortOrder.yAxis = -1;
                } else {
                    scope.sortOrder.yAxis = index;
                    scope.sortOrder.xAxis = -1;
                }
            });

        //x axis
        var xAxis = graph.append("g")
                .attr("clip-path", "url(#xAxisClip)")
                .append("g")
                .attr("id", "xAxisGroup")
                .attr("transform", "translate(" + scope.cellSize + ", -6) rotate (-90)")
            ;

        var xAxisLabels = xAxis.append("g")
            .attr("id", "xAxisLabels")
            .selectAll(".xAxisLabel")
            .data(scope.xAxisLabelStrings)
            .enter()
            .append("text")
            .style(scope.style.TEXT)
            .style(scope.style.AXIS.text)
            .text(function (d) {
                return d;
            })
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * scope.cellSize;
            })
            .style("text-anchor", "left")
            .attr("class", function (d, i) {
                return "xAxisLabel x-" + scope.getGraphName() + "-" + i;
            })
            .on("mouseover", function (d) {
                d3.select(this).style(scope.style.AXIS.textHover);
            })
            .on("mouseout", function (d) {
                d3.select(this).style(scope.style.AXIS.text);
            })
            .on("click", function (d) {
                var index = originalXAxisLabelStrings.indexOf("" + d);
                sortByLabel(false, index, (scope.sortOrder.xAxis != index));
                if (scope.sortOrder.xAxis == index) {
                    scope.sortOrder.xAxis = -1;
                } else {
                    scope.sortOrder.xAxis = index;
                    scope.sortOrder.yAxis = -1;
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
            .selectAll(".cell")
            .data(data.filter(function (x) {
                return scope.isInRange(x);
            }).filter(function (y) {
                return (+y[scope.value]).between((+scope.sliderValues[0])*0.01*colorScale.domain()[1], (+scope.sliderValues[1])*0.01*colorScale.domain()[1], true);
            }))
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return scope.xAxisLabelStrings.indexOf("" + d[scope.xColumn]) * scope.cellSize;
            })
            .attr("y", function (d) {
                return scope.yAxisLabelStrings.indexOf("" + d[scope.yColumn]) * scope.cellSize;
            })
            .attr("class", function (d) {
                return "cell cellX" + scope.xAxisLabelStrings.indexOf("" + d[scope.xColumn]) + " cellY" + scope.yAxisLabelStrings.indexOf("" + d[scope.yColumn]);
            })
            .attr("width", scope.cellSize)
            .attr("height", scope.cellSize)
            .style("fill", function (d) {
                return colorScale(d[scope.value]);
            })
            .on("mouseover", function (d) {
                //highlight text
                d3.select(".x-" + scope.getGraphName() + "-" + originalXAxisLabelStrings.indexOf("" + d[scope.xColumn])).style(scope.style.AXIS.textHighlight);
                d3.select(".y-" + scope.getGraphName() + "-" + originalYAxisLabelStrings.indexOf("" + d[scope.yColumn])).style(scope.style.AXIS.textHighlight);

                //highlight cell
                d3.select("#" + scope.getHighlightId())
                    .attr("transform", "translate(" + (scope.xAxisLabelStrings.indexOf("" + d[scope.xColumn]) * scope.cellSize) + ", " + (scope.yAxisLabelStrings.indexOf("" + d[scope.yColumn]) * scope.cellSize) + ")")
                    .style("display", "initial")
                ;

                //update the tooltip position and value
                d3.select("#" + scope.getTooltipId())
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 10) + "px")
                    .select("#value")
                    .text(scope.generateTooltip(d));

                //show the tooltip
                d3.select("#" + scope.getTooltipId()).style("display", "initial");
            })
            .on("mouseout", function () {
                d3.selectAll(".yAxisLabel").style(scope.style.AXIS.text);
                d3.selectAll(".xAxisLabel").style(scope.style.AXIS.text);

                d3.select("#" + scope.getTooltipId()).style("display", "none");

                d3.select("#" + scope.getHighlightId()).style("display", "none");
            })
        ;

        //grid
        if (scope.showGrid) {
            var grid = heatmap.append("g")
                .attr("id", "grid")
                .style(scope.style.GRID);
            ;

            grid.selectAll(".gridx")
                .data(scope.xAxisLabelStrings)
                .enter()
                .append("line")
                .attr("x1", function (d, i) {
                    return i * scope.cellSize;
                })
                .attr("y1", "0")
                .attr("x2", function (d, i) {
                    return i * scope.cellSize;
                })
                .attr("y2", scope.height)
                .attr("vector-effect", "non-scaling-stroke")
            ;

            grid.append("line")
                .attr("x1", scope.width)
                .attr("y1", "0")
                .attr("x2", scope.width)
                .attr("y2", scope.height)
                .attr("vector-effect", "non-scaling-stroke")
            ;

            grid.selectAll(".gridy")
                .data(scope.yAxisLabelStrings)
                .enter()
                .append("line")
                .attr("x1", "0")
                .attr("y1", function (d, i) {
                    return i * scope.cellSize;
                })
                .attr("x2", scope.width)
                .attr("y2", function (d, i) {
                    return i * scope.cellSize;
                })
                .attr("vector-effect", "non-scaling-stroke")
            ;

            grid.append("line")
                .attr("x1", "0")
                .attr("y1", scope.height)
                .attr("x2", scope.width)
                .attr("y2", scope.height)
                .attr("vector-effect", "non-scaling-stroke")
            ;
        }

        //cell highlight element
        var highlight = heatmap.append("g")
                .attr("id", scope.getHighlightId())
                .style(scope.style.HIGHLIGHT)
            ;

        highlight.append("line")
            .attr("x1", "0")
            .attr("y1", "0")
            .attr("x2", scope.cellSize)
            .attr("y2", "0")
            .attr("vector-effect", "non-scaling-stroke")
        ;

        highlight.append("line")
            .attr("x1", scope.cellSize)
            .attr("y1", "0")
            .attr("x2", scope.cellSize)
            .attr("y2", scope.cellSize)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        highlight.append("line")
            .attr("x1", scope.cellSize)
            .attr("y1", scope.cellSize)
            .attr("x2", "0")
            .attr("y2", scope.cellSize)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        highlight.append("line")
            .attr("x1", "0")
            .attr("y1", scope.cellSize)
            .attr("x2", "0")
            .attr("y2", "0")
            .attr("vector-effect", "non-scaling-stroke")
        ;

        //legend
        if (scope.showLegend) {
            var legend = graph.append("g")
                    .attr("id", "legend")
                    .selectAll(".legend")
                    .data(scope.range(colorScale.domain()[0], colorScale.domain()[1], scope.legendSteps))
                    .enter().append("g")
                ;

            legend.append("rect")
                .attr("x", function (d, i) {
                    return scope.legendElementSize.width * i;
                })
                .attr("y", scope.height + scope.legendOffset)
                .attr("width", scope.legendElementSize.width)
                .attr("height", scope.legendElementSize.height)
                .style(scope.style.LEGEND.border)
                .style("fill", colorScale)
            ;

            legend.append("text")
                .style(scope.style.TEXT)
                .style(scope.style.LEGEND.text)
                .text(function (d) {
                    return d;
                })
                .attr("width", scope.legendElementSize.width)
                .attr("x", function (d, i) {
                    return scope.legendElementSize.width * i;
                })
                .attr("y", scope.height + scope.legendTextOffset)
            ;
        }

        //attach zoom to the canvas
        scope.zoom.scaleExtent([1, 7]).on("zoom", function() {
            var e = d3.event,
                tx = Math.min(0, Math.max(e.translate[0], scope.width - scope.width * e.scale)),
                ty = Math.min(0, Math.max(e.translate[1], scope.height - scope.height * e.scale));

            scope.zoom.translate([tx, ty]);

            heatmap.attr("transform", "translate(" + [tx, ty] + ") scale(" + scope.zoom.scale() + ")");
            yAxisLabels.attr("transform", "translate(0, " + ty + ") scale(" + scope.zoom.scale() + ")");
            xAxisLabels.attr("transform", "translate(0, " + tx + ") scale(" + scope.zoom.scale() + ")");
            yAxis.attr("transform", "translate(-6, " + scope.cellSize * scope.zoom.scale() + ")");
            xAxis.attr("transform", "translate(" + scope.cellSize * scope.zoom.scale() + ", -6) rotate (-90)");

            // d3.select("#grid").style("stroke-width", 1/scope.zoom.scale() + "px");
            // d3.select(".highlight").style("stroke-width", 1/zoom.scale() + "px");
        });
        svg.call(scope.zoom);

        if (isRedraw) {
            scope.zoom.event(svg);
        }

        //sort
        var sortByLabel = function(isYAxis, index, sortOrder) {
            var t = svg.transition().duration(0);
            var byValue = [];
            for (var i = 0; i < (isYAxis ? scope.xAxisCount : scope.yAxisCount); i++) {
                byValue.push((sortOrder ? -Infinity : Infinity));
            }
            var sorted;
            d3.selectAll(".cell" + (isYAxis ? "Y" : "X") + index)
                .filter(isYAxis
                    ? function (ce) {
                        byValue[scope.xAxisLabelStrings.indexOf("" + ce[scope.xColumn])] = ce[scope.value];
                    }
                    : function (ce) {
                        byValue[scope.yAxisLabelStrings.indexOf("" + ce[scope.yColumn])] = ce[scope.value];
                    }
                )
            ;
            if (isYAxis) {
                sorted = d3.range(scope.xAxisCount).sort(function (a, b) {
                    if (sortOrder) {
                        return byValue[b] - byValue[a];
                    } else {
                        return byValue[a] - byValue[b];
                    }
                });
                t.selectAll(".cell")
                    .attr("x", function (d) {
                        return sorted.indexOf(scope.xAxisLabelStrings.indexOf("" + d[scope.xColumn])) * scope.cellSize;
                    })
                ;
                t.selectAll(".xAxisLabel")
                    .attr("y", function (d) {
                        return sorted.indexOf(scope.xAxisLabelStrings.indexOf(d)) * scope.cellSize;
                    })
                ;
                var newXAxisLabelStrings = [];
                for (var i = 0; i < sorted.length; i++) {
                    newXAxisLabelStrings.push(scope.xAxisLabelStrings[sorted[i]]);
                }
                scope.xAxisLabelStrings = newXAxisLabelStrings;
            } else {
                sorted = d3.range(scope.yAxisCount).sort(function (a, b) {
                    if (sortOrder) {
                        return byValue[b] - byValue[a];
                    } else {
                        return byValue[a] - byValue[b];
                    }
                });
                t.selectAll(".cell")
                    .attr("y", function (d) {
                        return sorted.indexOf(scope.yAxisLabelStrings.indexOf("" + d[scope.yColumn])) * scope.cellSize;
                    })
                ;
                t.selectAll(".yAxisLabel")
                    .attr("y", function (d) {
                        return sorted.indexOf(scope.yAxisLabelStrings.indexOf(d)) * scope.cellSize;
                    })
                ;
                var newYAxisLabelStrings = [];
                for (var i = 0; i < sorted.length; i++) {
                    newYAxisLabelStrings.push(scope.yAxisLabelStrings[sorted[i]]);
                }
                scope.yAxisLabelStrings = newYAxisLabelStrings;
            }
        }
    }

    //helper function for the legend
    range(start, end, steps) {
        var a = [];
        a.push(start);

        if (this.scaleType === SCALE_TYPES.linear) {
            var s = Math.trunc((end - start) / steps);

            for (var i = 2; i < steps; i++) {
                a.push(start + (i - 1) * s);
            }
        }

        if (this.scaleType === SCALE_TYPES.log) {
            var startLog = Math.log(start);
            var endLog = Math.log(end);

            s = (endLog - startLog) / (steps - 1);

            for (var i = 2; i < steps; i++) {
                a.push(Math.trunc(Math.pow(Math.E, (i - 1) * s)));
            }
        }

        a.push(end);
        return a;
    }

    generateTooltip(d) {
        var s = "";

        if (this.tooltipText.values.length <= 0) {
            var headers = arrayDifference(Object.getOwnPropertyNames(this.data[0]), [this.xColumn, this.yColumn, this.value]);
            s += format("x: {0}, y: {1}\n{2}: {3}", d[this.xColumn], d[this.yColumn], this.value, d[this.value]);

            for (var i = 0; i < headers.length; i++) {
                s += format("\n{0}: {1}", headers[i], d[headers[i]]);
            }
        } else {
            var v = this.tooltipText.values.map(function (x) {
                return d[x]
            });
            v.unshift(this.tooltipText.format);
            s += format.apply(null, v);
        }

        return s;
    }

    isInRange(x, domain) {
        return (+x[this.xColumn]).between(this.axisRange.x[0], this.axisRange.x[1], true) &&
            (+x[this.xColumn]).between(this.cellRange.x[0], this.cellRange.x[1], true) &&
            (+x[this.yColumn]).between(this.axisRange.y[0], this.axisRange.y[1], true) &&
            (+x[this.yColumn]).between(this.cellRange.y[0], this.cellRange.y[1], true);
    }

    getGraphName() {
        return this.parentElement.slice("#chart-".length);
    }

    getHighlightId() {
        return "highlight-" + this.getGraphName();
    }

    getTooltipId() {
        return "tooltip-" + this.getGraphName();
    }
}

Number.prototype.between = function (a, b, inclusive) {
    var min = Math.min(a, b),
        max = Math.max(a, b);

    return inclusive ? this >= min && this <= max : this > min && this < max;
}

function addHash(d) {
    return (d.lastIndexOf("#", 0) === 0) ? d : ("#" + d);
}

function arrayDifference(a1, a2) {
    return a1.filter(function (x) {
        return a2.indexOf(x) < 0
    });
}