# game/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    units = []  # shared unit positions (for demo)

    async def connect(self):
        self.room_name = "game_room"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()
        # Send current unit positions to the new client
        await self.send(text_data=json.dumps({"type": "init", "units": self.units}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data["type"] == "move_unit":
            # Update unit position
            unit_id = data["unit_id"]
            while len(self.units) <= unit_id:
                self.units.append({"x":0, "y":0, "z":0})
            self.units[unit_id] = {"x": data["x"], "y": data["y"], "z": data["z"]}

            # Broadcast to all clients
            await self.channel_layer.group_send(
                self.room_name,
                {"type": "game_update", "data": {"unit_id": unit_id, "x": data["x"], "y": data["y"], "z": data["z"]}}
            )

    async def game_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))
