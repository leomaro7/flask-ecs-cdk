FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

RUN echo "test"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
