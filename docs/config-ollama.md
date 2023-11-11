# `Ollama` x `big-AGI` :llama:

This guide helps you connect [Ollama](https://ollama.ai) [models](https://ollama.ai/library) to
[big-AGI](https://big-agi.com) for a professional AI/AGI operation and a good UI/Conversational
experience. The integration brings the popular big-AGI features to Ollama, including: voice chats,
editing tools, models switching, personas, and more.

![config-local-ollama-0-example.png](pixels/config-ollama-0-example.png)

## Quick Integration Guide

1. **Ensure Ollama API Server is Running**: Before starting, make sure your Ollama API server is up and running.
2. **Add Ollama as a Model Source**: In `big-AGI`, navigate to the **Models** section, select **Add a model source**, and choose **Ollama**.
3. **Enter Ollama Host URL**: Provide the Ollama Host URL where the API server is accessible (e.g., `http://localhost:11434`).
4. **Refresh Model List**: Once connected, refresh the list of available models to include the Ollama models.
5. **Start Using AI Personas**: Select an Ollama model and begin interacting with AI personas tailored to your needs.

### Ollama: installation and Setup

For detailed instructions on setting up the Ollama API server, please refer to the
[Ollama download page](https://ollama.ai/download) and [instructions for linux](https://github.com/jmorganca/ollama/blob/main/docs/linux.md).

### Visual Guide

* After adding the `Ollama` model vendor, entering the IP address of an Ollama server, and refreshing models:
  <img src="pixels/config-ollama-1-models.png" alt="config-local-ollama-1-models.png" style="max-width: 320px;">

* The `Ollama` admin panel, with the `Pull` button highlighted, after pulling the "Yi" model:
  <img src="pixels/config-ollama-2-admin-pull.png" alt="config-local-ollama-2-admin-pull.png" style="max-width: 320px;">

* You can now switch model/persona dynamically and text/voice chat with the models:
  <img src="pixels/config-ollama-3-chat.png" alt="config-local-ollama-3-chat.png" style="max-width: 320px;">

### Advanced: Model parameters

For users who wish to delve deeper into advanced settings, `big-AGI` offers additional configuration options, such
as the model temperature, maximum tokens, etc.

### Advanced: Ollama under a reverse proxy

You can elegantly expose your Ollama server to the internet (and thus make it easier to use from your server-side
big-AGI deployments) by exposing it on an http/https URL, such as: `https://yourdomain.com/ollama`

On Ubuntu Servers, you will need to install `nginx` and configure it to proxy requests to Ollama.

```bash
sudo apt update
sudo apt install nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then, edit the nginx configuration file `/etc/nginx/sites-enabled/default` and add the following block:

```nginx
    location /ollama/ {
        proxy_pass http://localhost:11434;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # Further proxy settings...
    }
```

Reach out to our community if you need help with this.

### Community and Support

Join our community to share your experiences, get help, and discuss best practices:

[![Official Discord](https://discordapp.com/api/guilds/1098796266906980422/widget.png?style=banner2)](https://discord.gg/MkH4qj2Jp9)


---

`big-AGI` is committed to providing a powerful, intuitive, and privacy-respecting AI experience.
We are excited for you to explore the possibilities with Ollama models. Happy creating!