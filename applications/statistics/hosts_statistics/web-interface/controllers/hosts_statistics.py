# -*- coding: utf-8 -*-

# Import Elasticsearch library
import elasticsearch
from elasticsearch_dsl import Search, Q, A
# Import global functions
from global_functions import escape


#----------------- Main Functions -------------------#


def hosts_statistics():
    """
    Show the main page of the Hosts Statistics section.

    :return: Empty dictionary
    """
    # Use standard view
    response.view = request.controller + '/hosts_statistics.html'
    return dict()


#----------------- Chart Functions ------------------#
