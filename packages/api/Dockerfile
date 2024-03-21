FROM python:3.9.7

WORKDIR /app

RUN useradd -m myapp -u 1001
RUN chown myapp:myapp /app
USER 1001
ENV PATH $PATH:/home/myapp/.local/bin

RUN pip3 install pipenv --user

COPY setup.py .
COPY setup.cfg .
RUN	pip install -e .[dev,test,prod]
RUN cp -r egapro.egg-info /tmp/egapro.egg-info

EXPOSE 2626

## PROD
ENV PRODUCTION="true"
COPY . .
CMD ["./start.sh"]
