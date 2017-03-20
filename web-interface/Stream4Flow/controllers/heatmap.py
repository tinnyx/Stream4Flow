# -*- coding: utf-8 -*-

# Import Elasticsearch library
import elasticsearch
from elasticsearch_dsl import Search, Q, A
# Import global functions
from global_functions import escape
import os


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
    if not (request.get_vars.beginning and request.get_vars.end and request.get_vars.aggregation and request.get_vars.type):
        json_response = '{"status": "Error", "data": "Some mandatory argument is missing!"}'
        return json_response

    # Parse inputs and set correct format
    beginning = escape(request.get_vars.beginning)
    end = escape(request.get_vars.end)
    aggregation = escape(request.get_vars.aggregation)
    type = escape(request.get_vars.type)  # name of field to create sum from, one of {flows, packets, bytes }

    try:
        json_response = '{"status": "Ok", "data": ' + get_statistics_data(beginning, end, aggregation, type) + '}'
        return json_response

    except Exception as e:
        json_response = '{"status": "Error", "data": "Elasticsearch query exception: ' + escape(str(e)) + '"}'
        return json_response

def get_statistics_data(beginning, end, aggregation, type):
    return open("applications/Stream4Flow/static/mock/parsed.json").read()