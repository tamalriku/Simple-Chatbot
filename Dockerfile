FROM python:3.13-slim

# Create a non-root user (required by HF Spaces)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application code
COPY --chown=user . .

# Default to 7860 (HF Spaces), override with $PORT on other platforms
ENV PORT=7860
EXPOSE $PORT

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
