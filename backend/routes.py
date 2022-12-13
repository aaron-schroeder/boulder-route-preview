import json

from arcgis.features import FeatureLayer
from flask import current_app as app
from flask import redirect, request, url_for, jsonify
from flask_cors import cross_origin

import data_ops


@app.route('/trails', methods=['GET'], strict_slashes=False)
@cross_origin()
def trails():
  """
  TODO: Consider whether this whole arcgis module is called for,
  just to make a request.
  """
  fl = FeatureLayer(
    'https://maps.bouldercolorado.gov/arcgis2/rest/services/osmp/'
    'TrailsNEW/MapServer/4/'
    # TrailsDissolve/MapServer/0'
    # TrailsOnly/FeatureServer/0'
  )

  # Get all available trails from the FeatureLayer
  fs = fl.query(outSR=4326)

  # with open('all_osmp_trails.json', 'w') as f:
  #   json.dump(json.loads(fs.to_geojson), f)

  return fs.to_geojson


@app.route('/create_route', methods=['POST'])
@cross_origin()
def create_route():
  data = request.get_json()

  single_linestring = data_ops.infer_single_linestring(data)

  # print(single_linestring)

  # lonlats = [ftr['geometry']['coordinates'][0] for ftr in single_linestring]
  lonlats = single_linestring['coordinates']

  df = data_ops.make_df_from_lonlat(lonlats)
  # print(df)
  # print(df.columns)
  # print(df.to_json())

  # Return the new dataframe as a json object
  # return df.to_json('records')

  xy_fig = data_ops.make_plot(df)
  fig_dict = json.loads(xy_fig.to_json())
  # print(type(fig_dict))
  # print(data_ops.calc_stats(df))

  return {
    'data': fig_dict['data'],
    'layout': fig_dict['layout'],
    'route': single_linestring,
    'stats': data_ops.calc_stats(df)
  }
