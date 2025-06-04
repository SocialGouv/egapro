FROM python:3.9.7

WORKDIR /app

RUN useradd -m myapp -u 1001
RUN chown myapp:myapp /app
USER 1001
ENV PATH=$PATH:/home/myapp/.local/bin

RUN pip3 install pipenv --user

# Copy all files first
COPY . .

# Install in development mode
RUN pip install -e .[dev,test,prod]

EXPOSE 2626

## PROD
ENV PRODUCTION="true"
CMD ["./start.sh"]
