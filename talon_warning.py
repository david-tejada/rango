from talon import app

def on_ready():
  app.notify("Error: wrong repository cloned. Remove the rango repository from your talon user folder and clone rango-talon instead.")

app.register("ready", on_ready)