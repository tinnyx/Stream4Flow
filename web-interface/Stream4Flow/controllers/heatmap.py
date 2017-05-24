# -*- coding: utf-8 -*-

# Import Elasticsearch library
import elasticsearch
from elasticsearch_dsl import Search, Q, A
# Import global functions
from global_functions import escape
import os
import json

# A temporary variable used to simulate CIDR field
# cidr = "192.168.0.0/22"

#----------------- Main Functions -------------------#


def heatmap():
    """
    Show the main page of the Heat Map section.

    :return: Empty dictionary
    """
    # Use standard view
    response.view = request.controller + '/heatmap.html'
    return dict()


#----------------- Chart Functions ------------------#


def get_statistics():
    """
    Obtains statistics about TCP, UDP a other protocols.

    :return: JSON with status "ok" or "error" and requested data.
    """

    # Check mandatory inputs
    # if not (request.get_vars.beginning and request.get_vars.end and request.get_vars.aggregation and request.get_vars.type):
    #     json_response = '{"status": "Error", "data": "Some mandatory argument is missing!"}'
    #     return json_response

    # Parse inputs and set correct format
    beginning = escape(request.get_vars.beginning)
    end = escape(request.get_vars.end)
    aggregation = escape(request.get_vars.aggregation)
    type = escape(request.get_vars.type)  # name of field to create sum from, one of {flows, packets, bytes }
    cidr = escape(request.get_vars.cidr)
    slider_begin = escape(request.get_vars.sliderBegin)
    slider_end = escape(request.get_vars.sliderEnd)

    # Added CIDR field, replace with value from the CIDR textbox
    try:
        json_response = '{' \
                        '"status": "Ok", ' \
                        '"data": [' \
                            + get_statistics_data(beginning, end, aggregation, type, "heatmap.json") + ","\
                            + get_statistics_data(beginning, end, aggregation, type, "heatmap-1.json") + ","\
                            + get_statistics_data(beginning, end, aggregation, type, "heatmap-2.json") + ","\
                            + get_statistics_data(beginning, end, aggregation, type, "heatmap-3.json") \
                        + "]"\
                        + ', "cidr": "' + cidr + '"' \
                        + ', "sliderBegin": "' + slider_begin + '"' \
                        + ', "sliderEnd": "' + slider_end + '"' \
                        + '}'
        return json_response

    except Exception as e:
        json_response = '{"status": "Error", "data": "Elasticsearch query exception: ' + escape(str(e)) + '"}'
        return json_response

# Parser for the JSON file
def get_statistics_data(beginning, end, aggregation, type, filename):
    #fields should be used when working with real data

    json_string = open("applications/Stream4Flow/static/mock/" + filename).read()
    json_data = json.loads(json_string)

    buckets = json_data["aggregations"]["by host"]["buckets"]

    return json.dumps(list(map(transform, buckets)))

# A helper method for the parser
def transform(x):
    ip_parts = x["key"].split(".")
    return {"thirdBlock": ip_parts[2], "fourthBlock": ip_parts[3], "docCount": x["doc_count"], "sumOfFlows": int(x["sum_of_flows"]["value"])}