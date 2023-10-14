FROM python:3.11-slim

RUN mkdir app/
COPY . /app/
WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y build-essential
# Install requirements.txt
RUN pip install -r requirements.txt


CMD [ "python", "app.py"]