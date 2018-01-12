# Peltarion Code Test

Repository containing code challenge/test from Peltarion, original prompt information included at bottom

## Usage

- Install NodeJS 8.9+
- Install Redis
- Run `npm i` in repo root
- Create `.env` file with the following information:
    ```
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    ```
- Go to http://localhost:3000/

## Environment variables

| Name | Default | Description |
| ------------- | ------------- |  ------------- |
| NODE_ENV | `development` | Used to determine whether to run in production mode |
| PORT | `3000` | Port to run on |
| REDIS_HOST | | Address of the redis host |
| REDIS_PORT | `6379` | Port of the redis server |
| EMAIL | | Email to register SSL certificates to |
| HOST | | Comma-delimited list of the domain(s) the application will be served on |

## Running in production

* Install latest stable Docker CE
* Create a directory wherever and `cd` to that directory
* Copy over the `docker-compose.yml` and `start.sh` files
* Mark the `start.sh` script executable `chmod +x ./start.sh`
* Create a `.env` file and populate it with at least the following variables populated:
  * EMAIL
  * HOST
* Run `./start.sh` (**Note:** It can take 5-10mins to generate the dhparam file on first run)
* ???
* Profit!

___


## Prompt

Create the game Tic-tac-toe as a web application where two players can play against each other. The purpose is to have a piece of code written by you to use as a foundation for talking about your approach to solving a programming project.

## Game rules
Tic-tac-toe ​is a game for two players, X and O, who take turns marking the spaces in a 3×3 grid.

The player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row wins the game. X goes first.

## Requirements
* The game should be playable in two different browser windows
* The game should have a server part and a client part (both shall be implemented by you)
* The following languages can be used for the server part: Java, Javascript or Python

## Guidelines:
* Keep it simple (i.e. fancy high-score lists, searching for opponents and so on are non-values)
* Use 3rd party libraries with moderation and try to find the right balance
* If there are priorities to be made, we prefer you implementing a smaller set of features using your own code, rather than use a large framework.

## Bonus tasks
If you feel like it, also solve one or more of these bonus tasks. This is not strictly required but will naturally be taken into consideration and cater for more interesting discussions during the tech interview.

* Spectator support - i.e. visitors that cannot affect the game state
* Multi-game support - i.e. many games can be played simultaneously at different url:s, one user flow could be this:
  1. One user creates a new game
  1. User selects X or O
  1. User gets unique url to the game
  1. User can invite other player by sending the game url
* Multi-game reconnect-support - i.e. users can reconnect to the game by logging in on the same url
* Network connectivity issues - i.e. handle bad network conditions gracefully
* Persistence - i.e. game state can be resumed after server restart
