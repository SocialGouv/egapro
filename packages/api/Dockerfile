# Floating 3.12 tag: rebuilds pick up Python security releases (3.9 is end of life).
FROM python:3.12

WORKDIR /app

RUN useradd -m myapp -u 1001
RUN chown myapp:myapp /app
USER 1001
ENV PATH=$PATH:/home/myapp/.local/bin

COPY setup.py .
COPY setup.cfg .
# Runtime dependencies only: no test/dev tooling in the production image.
RUN	pip install .[prod]

EXPOSE 2626

## PROD
ENV PRODUCTION="true"
COPY . .
CMD ["./start.sh"]
