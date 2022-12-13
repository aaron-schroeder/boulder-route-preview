from flask import Flask
from flask_cors import CORS

import config


def create_app():
  app = Flask(__name__, instance_relative_config=True)
  app.config.from_object(config.Config)

  with app.app_context():
    import routes

  cors = CORS()
  cors.init_app(app)

  return app


if __name__ == '__main__':
  app = create_app()
  app.run(debug=True)