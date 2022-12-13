import geojson
import numpy as np
import pandas as pd
import pandas_xyz
import plotly.graph_objects as go
import query as zquery


def make_df_from_lonlat(lonlat):
  """
  Args:
    lonlat (array of ???):
  Returns:
    pandas.DataFrame: ...
  """
  df = pd.DataFrame.from_records(lonlat, columns=['lon', 'lat'])
  
  # Get elevation coordinates for the data
  # TODO: get query installed via pypi, with a new name etc.
  # NOTE: As usual, seeing how HNS could make my headaches go away by
  #       standardizing this.
  # NOTE: This one is quite slow, and may fail when handling much more than
  #       1000 points.
  # df['elevation'] = zquery.national_map_epqs(df[['lat', 'lon']].values)
  df['elevation'] = zquery.national_map_1m(df[['lat', 'lon']].values,
    '/home/aaron/aaron-schroeder/elevation-query/data/all.tif'
    # '/Users/aaron/code/aaron-schroeder/elevation-query/data/all.tif'
    # '/Users/aaron/Downloads/USGS_one_meter_x47y443_CO_SoPlatteRiver_Lot5_2013.tif'
  )
  df['elevation'] = df['elevation'] * 5280 / 1609.34

  # Arrange the DF from low to high.
  if df['elevation'].iloc[-1] < df['elevation'].iloc[0]:
    df = df.iloc[::-1].reset_index(drop=True)

  df['distance'] = df.xyz.s_from_xy(lat='lat', lon='lon')

  df['elevation_smooth'] = df.xyz.z_smooth_distance(
    distance='distance',
    elevation='elevation',
    sample_len=5.0, window_len=7, polyorder=2,  # default
  )
  df['elevation_smooth_short'] = df.xyz.z_smooth_distance(
    distance='distance',
    elevation='elevation',
    sample_len=2.0, window_len=7, polyorder=2, # just messin aroun'
  )

  df['grade'] = 100.0 * np.gradient(df['elevation_smooth'] * 1609.34 / 5280, df['distance'])
  df['grade_short'] = 100.0 * np.gradient(df['elevation_smooth_short'] * 1609.34 / 5280, df['distance'])
  
  return df


# def infer_single_linestring(xy_arrs):
def infer_single_linestring(feature_collection):
  from shapely.geometry import LineString, MultiLineString
  from shapely.ops import nearest_points

  xy_arrs = [ftr['geometry']['coordinates'][0] for ftr in feature_collection]
  # xy_arrs = list(xy_arrs)  # JIC it's a generator

  mls = MultiLineString(xy_arrs)
  ls = mls[0]
  while len(mls) > 1:
    mls_other = [l for l in mls if l != ls]

    # Calculate distances to other linestrings, only considering endpoints.
    distances = [ls.boundary.distance(ls_other.boundary) for ls_other in mls_other]

    # Find the linestring that corresponds to the minimum distance.
    ls_nearest = mls_other.pop(distances.index(min(distances)))

    # Find the corresponding ends that are closest.
    endpoint_cur, endpoint_next = nearest_points(ls.boundary, ls_nearest.boundary)

    # Keep the current segment's direction, and orient the other ls
    # by flipping it and/or placing it in front or at the end.
    if endpoint_cur == ls.boundary[0]:
      # Attach the other linestring to the START.
      if endpoint_next == ls_nearest.boundary[0]:
        # Flip it around.
        ls = LineString(list(ls_nearest.coords[::-1]) + list(ls.coords))
      else:
        # Stitch it on as-is
        ls = LineString(list(ls_nearest.coords) + list(ls.coords))
    else:
      # Attach the other linestring at the END.
      if endpoint_next == ls_nearest.boundary[0]:
        # Stitch it on as-is
        ls = LineString(list(ls.coords) + list(ls_nearest.coords))
      else:
        # Flip it around.
        ls = LineString(list(ls.coords) + list(ls_nearest.coords[::-1]))

    mls = [ls] + mls_other

  xy_arr = [c for c in ls.simplify(tolerance=0).coords]
  geojson_data = geojson.LineString(xy_arr, precision=8)

  return geojson_data


def make_plot(df):
  return go.Figure(
    [
      go.Scatter(
        x=df['distance'],
        y=df['elevation'],
        mode='markers',
        name='elevation',
      ),
      # go.Scatter(
      #   x=distance_ds,
      #   y=elevation_ds,
      #   name='elevation (5m sample)',
      #   mode='markers',
      # ),
      go.Scatter(
        x=df['distance'],
        y=df['elevation_smooth_short'],
        name='elevation smooth (2m)',
      ),
      go.Scatter(
        x=df['distance'],
        y=df['elevation_smooth'],
        name='elevation smooth (5m)',
      ),
      # Not sure where to handle this currently.
      # go.Scatter(
      #   x=distance_ds,
      #   y=grade_ds,
      #   name='grade (5m avg)',
      #   # mode='markers',
      #   yaxis='y2',
      # ),
      go.Scatter(
        x=df['distance'],
        y=df['grade_short'],
        name='grade (2m)',
        yaxis='y2',
      ),
      go.Scatter(
        x=df['distance'],
        y=df['grade'],
        name='grade (5m)',
        yaxis='y2',
      ),
    ],
    layout=dict(
      margin=dict(b=30,t=0,r=0,l=0),
      hovermode='x',
      legend=dict(orientation='h'),
      xaxis=dict(
        hoverformat='.1f',
        ticksuffix=' m',
      ),
      yaxis=dict(
        side='left',
        showgrid=False,
        showticklabels=False,
        hoverformat='.1f',
        ticksuffix='\'',
      ),
      yaxis2=dict(
        anchor='x',
        overlaying='y',
        side='right',
        # showgrid=False,
        # showticklabels=False,
        # zeroline=True,
        hoverformat='.1f',
        ticksuffix='%',
      ),
    ),
  )


def calc_stats(df):
  return {
    'distance': f'{df["distance"].iloc[-1] / 1609.34:.2f} mi',
    'gain': {
      'net': f'{df["elevation"].iloc[-1] - df["elevation"].iloc[0]:.0f}\'',
      'naive': f'{df.xyz.z_gain_naive(elevation="elevation"):.0f}\'',
      'threshold': f'{df.xyz.z_gain_threshold(elevation="elevation"):.0f}\'',
      'naive_5m': f'{df.xyz.z_gain_naive(elevation="elevation_smooth"):.0f}\'',
      'naive_2m': f'{df.xyz.z_gain_naive(elevation="elevation_smooth_short"):.0f}\'',
    }
  }


def additional_df_calcs_tmp(df):
  """Catch-all function for unused calcs.
  TODO: 
    * Actually plug this into something so I can display these results.
    * Consider whether these actions should be rolled into pandas-xyz.
      Because that's the codebase I stole them from!
      And they make sense over there IMO.
  """
  # Subsample 5m-smoothed elevation at 5m intervals, then take the diff
  # to get 5m-avg grade.
  import math
  from scipy.interpolate import interp1d
  n_sample = math.ceil(
    (df['distance'].iloc[-1] - df['distance'].iloc[0]) / 5.0
    # (df['distance'].iloc[-1] - df['distance'].iloc[0]) / 10.0
  )
  distance_ds = np.linspace(
    df['distance'].iloc[0],
    df['distance'].iloc[-1], 
    n_sample + 1
  )
  interp_fn_5m = interp1d(df['distance'], df['elevation_smooth'], kind='linear')
  interp_fn = interp1d(df['distance'], df['elevation'], kind='linear')
  interp_fn_2m = interp1d(df['distance'], df['elevation_smooth_short'], kind='linear')
  elevation_ds_5m = interp_fn_5m(distance_ds)
  elevation_ds = interp_fn(distance_ds)
  elevation_ds_2m = interp_fn_2m(distance_ds)
  grade_ds_5m = 100.0 * 1609.34 / 5280 * np.diff(elevation_ds_5m) / np.diff(distance_ds)
  grade_ds = 100.0 * 1609.34 / 5280 * np.diff(elevation_ds) / np.diff(distance_ds)
  grade_ds_2m = 100.0 * 1609.34 / 5280 * np.diff(elevation_ds_2m) / np.diff(distance_ds)

  # from power import cost_of_inclined_treadmill_running as cr
  def cr(grade):
    """Copied this from power package out of laziness for now."""
    grade = max(-0.45, min(grade, 0.45))

    # Calculate metabolic cost of running (neglecting air resistance),
    # in Joules per meter traveled per kg of body weight, as a function of
    # decimal grade (on a treadmill, technically). From (Minetti, 2002).
    # Valid for grades shallower than 45% (0.45 in decimal form).
    c_i = 155.4 * grade ** 5 - 30.4 * grade ** 4 - 43.3 * grade ** 3  \
      + 46.3 * grade ** 2 + 19.5 * grade + 3.6

    return c_i

  def cr_slope(grade):
    return [cr(g / 100.0) / math.cos(math.atan(g/100))
            for g in grade if not np.isnan(g)]

  cr_ds_5m = cr_slope(grade_ds_5m)
  cr_ds = cr_slope(grade_ds)
  cr_ds_2m = cr_slope(grade_ds_2m)
  cr_flat = cr(0.0)
  equiv_d_5m = df['distance'].iloc[-1] * (sum(cr_ds_5m) / len(cr_ds_5m)) / cr_flat
  equiv_d = df['distance'].iloc[-1] * (sum(cr_ds) / len(cr_ds)) / cr_flat
  equiv_d_2m = df['distance'].iloc[-1] * (sum(cr_ds_2m) / len(cr_ds_2m)) / cr_flat