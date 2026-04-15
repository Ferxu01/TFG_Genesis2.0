import { Injectable } from '@angular/core';
import { ConnectionEntity, Options } from 'app/models/Connection.model';
import mqtt, { MqttClient } from 'mqtt';
import { Observable } from 'rxjs';
import { ConnectionStrategy } from './ConnectionStrategy';

@Injectable({
    providedIn: 'root',
})
export class MqttMessageService implements ConnectionStrategy {
    private clients: Map<
        string,
        { client: MqttClient; queue: { payload: string; observer: any }[] }
    > = new Map();

    private generateClientKey({ URL, clientId, username }: Options) {
        return `${URL}_${clientId}_${username}`;
    }

    private getClient(
        connectionOptions: ConnectionEntity['options']
    ): MqttClient {
        const { URL, clientId, username, password } = connectionOptions;
        const key = this.generateClientKey(connectionOptions);

        if (this.clients.has(key)) return this.clients.get(key).client;

        const client = mqtt.connect(`${URL}/mqtt`, {
            clientId,
            username,
            password,
            clean: true,
            reconnectPeriod: 1000,
            keepalive: 60,
        });

        this.clients.set(key, { client, queue: [] });

        client.on('connect', () => {
            console.log(`MQTT conectado: ${key}`);
            const clientEntry = this.clients.get(key);
            if (!clientEntry) return;
            // Procesar la cola
            clientEntry.queue.forEach((msg) => {
                client.publish(connectionOptions.topic, msg.payload, (err) => {
                    if (err) msg.observer.error(err);
                    else msg.observer.next(true);
                    msg.observer.complete();
                });
            });
            clientEntry.queue = [];
        });
        client.on('error', (err) => console.error(`Error MQTT (${key}):`, err));
        client.on('offline', () =>
            console.warn(`Cliente MQTT desconectado: ${key}`)
        );

        return client;
    }

    sendMessage(
        message: any,
        connectionOptions: ConnectionEntity['options']
    ): Observable<boolean> {
        const mqttClient = this.getClient(connectionOptions);
        const key = this.generateClientKey(connectionOptions);
        const messagePayload = JSON.stringify(message);
        const clientEntry = this.clients.get(key);

        return new Observable<boolean>((observer) => {
            if (mqttClient.connected) {
                mqttClient.publish(
                    connectionOptions.topic,
                    messagePayload,
                    (err) => {
                        if (err) observer.error(err);
                        else observer.next(true);
                        observer.complete();
                    }
                );
            } else {
                // Push a la cola para enviar cuando se conecte
                clientEntry.queue.push({ payload: messagePayload, observer });
            }

            return () => {};
        });
    }

    // Método que debes llamar al terminar la simulación para cerrar la conexión
    closeConnection(connectionOptions: ConnectionEntity['options']) {
        const key = this.generateClientKey(connectionOptions);
        const clientEntry = this.clients.get(key);

        if (!clientEntry) {
            console.warn(`No hay cliente MQTT para cerrar: ${key}`);
            return;
        }

        const { client } = clientEntry;

        client.end(true, {}, () => {
            console.log(`MQTT client ${key} cerrado.`);
            this.clients.delete(key);
        });
    }
}
