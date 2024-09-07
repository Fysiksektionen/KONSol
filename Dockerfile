FROM node:22.8.0

# We have to install nodemon globally before moving into the working directory
RUN npm install -g nodemon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Make sure start.sh is executable
RUN ["chmod", "+x", "./start.sh"]

EXPOSE 8080
ENTRYPOINT [ "./start.sh" ]