/**
 * =============================================================================
 * ENGLISH HEADER
 * =============================================================================
 *
 * YouTube Playlist Creator/Updater (Consolidated & Bilingual)
 *
 * This script creates or updates a YouTube playlist in your account with **all public videos**
 * from a specified channel's uploads playlist. Note that the YouTube API does not easily
 * distinguish music from other video types, so all public videos will be included.
 *
 * === MANDATORY SETUP (Script Properties) ===
 * 1. Go to "Project Settings" (gear icon ⚙️).
 * 2. Under the "Script properties" section, click "Edit script properties".
 * 3. Add the following properties:
 * - CHANNEL_ID: The ID of the YouTube channel you want to copy videos from (e.g., UCxxxxxxxxxxxxxxxxxxxxxx).
 * - YOUTUBE_CLIENT_ID: Your OAuth 2.0 Client ID from Google Cloud Console.
 * - YOUTUBE_CLIENT_SECRET: Your OAuth 2.0 Client Secret from Google Cloud Console.
 *
 * === OPTIONAL SETUP (Script Properties) ===
 * - DESTINATION_PLAYLIST_NAME: The name for the playlist to be created/updated in *your* account.
 * Defaults to "My Synced Playlist" / "Minha Playlist Sincronizada".
 * - DESTINATION_PLAYLIST_ID: The ID of an *existing* playlist in *your* account that you want to update.
 * If provided, the script will use this playlist instead of searching/creating by name.
 *
 * === HOW TO USE ===
 * 1. Configure the Script Properties (see above).
 * 2. Open the Script Editor.
 * 3. In the "Select function" dropdown menu, choose "runSyncProcess".
 * 4. Click "Run".
 * 5. The first time you run it, authorize the script to access your YouTube account. Follow the authorization link.
 * 6. Check the logs under "View" > "Logs" to monitor progress.
 *
 * === IMPORTANT NOTE ===
 * This script fetches ALL public videos from the source channel's 'uploads' playlist.
 * The YouTube API does not allow automatic filtering for "music only". If the source
 * channel mixes music with other video types, all will be added.
 *
 * =============================================================================
 * CABEÇALHO PORTUGUÊS
 * =============================================================================
 *
 * Criador/Atualizador de Playlist do YouTube (Consolidado e Bilíngue)
 *
 * Este script cria ou atualiza uma playlist do YouTube na sua conta com **todos os vídeos públicos**
 * da playlist de uploads de um canal especificado. Note que a API do YouTube não distingue
 * facilmente músicas de outros tipos de vídeo, então todos os vídeos públicos serão incluídos.
 *
 * === CONFIGURAÇÃO OBRIGATÓRIA (Propriedades do Script) ===
 * 1. Vá para "Configurações do projeto" (ícone de engrenagem ⚙️).
 * 2. Na seção "Propriedades do script", clique em "Editar propriedades do script".
 * 3. Adicione as seguintes propriedades:
 * - CHANNEL_ID: O ID do canal do YouTube de onde você quer copiar os vídeos (Ex: UCxxxxxxxxxxxxxxxxxxxxxx).
 * - YOUTUBE_CLIENT_ID: Seu ID de cliente OAuth 2.0 do Google Cloud Console.
 * - YOUTUBE_CLIENT_SECRET: Seu segredo de cliente OAuth 2.0 do Google Cloud Console.
 *
 * === CONFIGURAÇÃO OPCIONAL (Propriedades do Script) ===
 * - DESTINATION_PLAYLIST_NAME: Nome da playlist a ser criada/atualizada na *sua* conta.
 * Padrão: "Minha Playlist Sincronizada" / "My Synced Playlist".
 * - DESTINATION_PLAYLIST_ID: O ID de uma playlist *sua* já existente que você quer atualizar.
 * Se fornecido, o script usará esta playlist em vez de procurar/criar pelo nome.
 *
 * === COMO USAR ===
 * 1. Configure as Propriedades do Script (veja acima).
 * 2. Abra o Editor de Scripts.
 * 3. No menu suspenso "Selecionar função", escolha "runSyncProcess".
 * 4. Clique em "Executar".
 * 5. Na primeira vez, autorize o script a acessar sua conta do YouTube. Siga o link de autorização.
 * 6. Verifique os logs em "Ver" > "Registros" para acompanhar o progresso.
 *
 * === OBSERVAÇÃO IMPORTANTE ===
 * Este script busca TODOS os vídeos públicos da playlist 'uploads' do canal de origem.
 * A API do YouTube não permite filtrar automaticamente apenas por "música". Se o canal
 * de origem mistura músicas com outros tipos de vídeo, todos serão adicionados.
 */

// ---------- MAIN FUNCTION TO RUN / FUNÇÃO PRINCIPAL PARA EXECUTAR ----------
// Select this function in the dropdown menu and click "Run"
// Selecione esta função no menu suspenso e clique em "Executar"
function runSyncProcess() {
  var props = PropertiesService.getScriptProperties();

  // --- 1. Read Settings / Ler Configurações ---
  var channelId = props.getProperty('CHANNEL_ID');
  var clientId = props.getProperty('YOUTUBE_CLIENT_ID');
  var clientSecret = props.getProperty('YOUTUBE_CLIENT_SECRET');
  var destinationName = props.getProperty('DESTINATION_PLAYLIST_NAME') || "Minha Playlist Sincronizada"; // PT default
  var destinationNameEn = props.getProperty('DESTINATION_PLAYLIST_NAME') || "My Synced Playlist"; // EN default
  var destinationPlaylistId = props.getProperty('DESTINATION_PLAYLIST_ID'); // May be null / Pode ser nulo

  Logger.log('--- Iniciando Sincronização de Playlist do YouTube / Starting YouTube Playlist Sync ---');
  Logger.log('Configurações Carregadas / Settings Loaded:');
  Logger.log('- CHANNEL_ID: ' + (channelId || 'NÃO CONFIGURADO / NOT SET!'));
  Logger.log('- DESTINATION_PLAYLIST_ID: ' + (destinationPlaylistId || 'Não fornecido (usará nome) / Not provided (will use name)'));
  Logger.log('- DESTINATION_PLAYLIST_NAME (PT): ' + destinationName + (destinationPlaylistId ? ' (Ignorado se ID for válido / Ignored if ID is valid)' : ''));
  Logger.log('- DESTINATION_PLAYLIST_NAME (EN): ' + destinationNameEn + (destinationPlaylistId ? ' (Ignored if ID is valid / Ignorado se ID for válido)' : ''));
  Logger.log('- YOUTUBE_CLIENT_ID: ' + (clientId ? 'CONFIGURADO / SET' : 'NÃO CONFIGURADO / NOT SET!'));
  Logger.log('- YOUTUBE_CLIENT_SECRET: ' + (clientSecret ? 'CONFIGURADO / SET' : 'NÃO CONFIGURADO / NOT SET!'));
  Logger.log('-----------------------------------------------------');

  // --- 2. Validate Essential Settings / Validar Configurações Essenciais ---
  if (!channelId || !clientId || !clientSecret) {
    Logger.log('ERRO CRÍTICO / CRITICAL ERROR: Propriedades obrigatórias (CHANNEL_ID, YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET) não configuradas. / Required properties not set.');
    Logger.log('Acesse "Configurações do projeto" (⚙️) > "Propriedades do script" para configurá-las. / Go to "Project Settings" (⚙️) > "Script properties" to set them.');
    return; // Stop execution / Interrompe a execução
  }

  // Validate Channel ID format / Validar formato do Channel ID
  if (!/^UC[\w-]{22}$/.test(channelId)) {
    Logger.log('ERRO / ERROR: ChannelID inválido! Deve começar com UC seguido de 22 caracteres alfanuméricos ou hífens. / Invalid ChannelID! Must start with UC followed by 22 alphanumeric characters or hyphens.');
    return;
  }

  // --- 3. Authenticate with YouTube API / Autenticar com API do YouTube ---
  var service = getYouTubeService();
  if (!service.hasAccess()) {
    Logger.log('Autorização necessária. Por favor, execute o script novamente e siga o link de autorização. / Authorization required. Please run the script again and follow the authorization link.');
    // Attempt to show the link in the log (may not be clickable depending on the environment)
    // Tenta mostrar o link no log (pode não ser clicável dependendo do ambiente)
    Logger.log('URL de Autorização / Authorization URL: ' + service.getAuthorizationUrl());
    // For web app or trigger execution scenarios that can display HTML:
    // Para o caso de execução como web app ou trigger que pode mostrar HTML:
    // return HtmlService.createHtmlOutput(`<p>Autorização necessária. Por favor, visite este URL e autorize:</p><p><a href="${service.getAuthorizationUrl()}" target="_blank">Autorizar Acesso ao YouTube</a></p><p>Depois de autorizar, execute o script novamente.</p>`);
    return; // Stop until authorized / Interrompe até autorizar
  }
  Logger.log('Autenticação com YouTube bem-sucedida. / YouTube authentication successful.');

  // --- 4. Start Synchronization Process / Iniciar Processo de Sincronização ---
  try {
    Logger.log(`Iniciando busca de vídeos do canal de origem / Starting video fetch from source channel: ${channelId}`);

    // --- 4a. Get Source Channel Uploads Playlist / Obter Playlist de Uploads do Canal de Origem ---
    var uploadsPlaylistId = getUploadsPlaylistId(service, channelId);
    Logger.log(`ID da playlist de uploads do canal de origem / Source channel uploads playlist ID: ${uploadsPlaylistId}`);
    Logger.log(`AVISO / WARNING: Buscando TODOS os vídeos públicos desta playlist, não apenas músicas. / Fetching ALL public videos from this playlist, not just music.`);

    // --- 4b. Get ALL Video IDs from Source Channel / Obter TODOS os IDs de Vídeo do Canal de Origem ---
    var sourceVideoIds = getAllVideoIds(service, uploadsPlaylistId);
    Logger.log(`Total de vídeos encontrados no canal de origem / Total videos found on source channel: ${sourceVideoIds.length}`);
    if (sourceVideoIds.length === 0) {
      Logger.log('AVISO / WARNING: Nenhum vídeo encontrado na playlist de uploads do canal de origem. Verifique o ID do canal e a visibilidade dos vídeos. / No videos found in the source channel uploads playlist. Check channel ID and video visibility.');
      // Nothing to sync, but we can continue to ensure the destination playlist exists
      // Não há o que sincronizar, mas podemos continuar para garantir que a playlist de destino exista
    }

    // --- 4c. Determine/Find/Create Destination Playlist / Determinar/Encontrar/Criar a Playlist de Destino ---
    var targetPlaylistId;
    // Use Portuguese name as primary for finding/creating if not using ID
    // Usa nome em português como primário para encontrar/criar se não usar ID
    var targetPlaylistTitle = destinationName;
    var targetPlaylistTitleEn = destinationNameEn; // Keep EN name for logs if needed

    if (destinationPlaylistId) {
      Logger.log(`Tentando usar playlist de destino especificada pelo ID / Attempting to use destination playlist specified by ID: ${destinationPlaylistId}`);
      try {
        var playlistInfo = getPlaylistInfo(service, destinationPlaylistId); // Checks if it exists and is accessible / Verifica se existe e é acessível
        targetPlaylistId = destinationPlaylistId;
        targetPlaylistTitle = playlistInfo.title; // Use the actual name of the found playlist / Usa o nome real da playlist encontrada
        Logger.log(`Playlist de destino encontrada pelo ID / Destination playlist found by ID: "${targetPlaylistTitle}" (${targetPlaylistId})`);
      } catch (error) {
        Logger.log(`AVISO / WARNING: Não foi possível acessar a playlist com ID ${destinationPlaylistId}: ${error.message}. / Could not access playlist with ID ${destinationPlaylistId}: ${error.message}.`);
        Logger.log(`Tentando encontrar ou criar playlist pelo nome (PT) / Attempting to find or create playlist by name (PT): "${destinationName}"`);
        targetPlaylistId = findOrCreatePlaylist(service, destinationName, destinationNameEn); // Pass both names
        targetPlaylistTitle = destinationName; // Assume desired name when creating/finding / Assume o nome desejado ao criar/encontrar
        Logger.log(`Usando playlist encontrada/criada pelo nome / Using playlist found/created by name: "${targetPlaylistTitle}" (${targetPlaylistId})`);
      }
    } else {
      Logger.log(`Procurando ou criando playlist de destino pelo nome (PT) / Searching for or creating destination playlist by name (PT): "${destinationName}"`);
      targetPlaylistId = findOrCreatePlaylist(service, destinationName, destinationNameEn); // Pass both names
      targetPlaylistTitle = destinationName; // Assume desired name / Assume o nome desejado
      Logger.log(`Usando playlist encontrada/criada / Using playlist found/created: "${targetPlaylistTitle}" (${targetPlaylistId})`);
    }

    // --- 4d. Get ALL Video IDs from Destination Playlist / Obter TODOS os IDs de Vídeo da Playlist de Destino ---
    Logger.log(`Buscando vídeos existentes na playlist de destino / Fetching existing videos from destination playlist: "${targetPlaylistTitle}" (${targetPlaylistId})`);
    var existingVideoIds = getAllVideoIds(service, targetPlaylistId);
    Logger.log(`Vídeos já existentes na playlist de destino / Videos already in destination playlist: ${existingVideoIds.length}`);

    // --- 4e. Compare and Identify Missing Videos / Comparar e Identificar Vídeos Faltantes ---
    var missingInPlaylist = sourceVideoIds.filter(id => !existingVideoIds.includes(id));
    // Optional: Identify videos that are in the playlist but no longer on the source channel
    // Opcional: Identificar vídeos que estão na playlist mas não mais no canal de origem
    // var extraInPlaylist = existingVideoIds.filter(id => !sourceVideoIds.includes(id));

    Logger.log('--- Comparação / Comparison ---');
    Logger.log(`Vídeos no canal de origem / Videos on source channel: ${sourceVideoIds.length}`);
    Logger.log(`Vídeos na playlist de destino / Videos in destination playlist: ${existingVideoIds.length}`);
    Logger.log(`Vídeos do canal FALTANDO na playlist / Source channel videos MISSING from playlist: ${missingInPlaylist.length}`);
    // Logger.log(`Vídeos na playlist que NÃO ESTÃO MAIS no canal de origem / Videos in playlist NO LONGER on source channel: ${extraInPlaylist.length}`); // Uncomment if implementing removal / Descomente se implementar remoção

    // --- 4f. Add Missing Videos / Adicionar Vídeos Faltantes ---
    if (missingInPlaylist.length > 0) {
      Logger.log(`Adicionando ${missingInPlaylist.length} vídeos faltantes à playlist "${targetPlaylistTitle}"... / Adding ${missingInPlaylist.length} missing videos to playlist "${targetPlaylistTitle}"...`);
      var addedCount = addVideosToPlaylist(service, targetPlaylistId, missingInPlaylist);
      Logger.log(`Processo de adição concluído / Add process completed: ${addedCount} de / of ${missingInPlaylist.length} vídeos foram adicionados com sucesso / videos were added successfully.`);
      if (addedCount < missingInPlaylist.length) {
        Logger.log(`ATENÇÃO / WARNING: ${missingInPlaylist.length - addedCount} vídeos não puderam ser adicionados. / videos could not be added. Isso pode ocorrer devido a restrições (privados, excluídos, regionais), problemas na API ou limites de cota. / This can happen due to restrictions (private, deleted, regional), API issues, or quota limits.`);
      }
    } else {
      Logger.log('A playlist de destino já contém todos os vídeos encontrados no canal de origem. Nenhuma adição necessária. / Destination playlist already contains all videos found on the source channel. No additions needed.');
    }

    // Optional: Remove extra videos (Uncomment the section below if you want this functionality)
    // Opcional: Remover vídeos extras (Descomente a seção abaixo se quiser esta funcionalidade)
    /*
    if (extraInPlaylist.length > 0) {
        Logger.log(`Removendo ${extraInPlaylist.length} vídeos que estão na playlist mas não no canal de origem... / Removing ${extraInPlaylist.length} videos that are in the playlist but not on the source channel...`);
        // WARNING: Removal requires fetching the 'playlistItemId' for each video, not just the 'videoId'.
        // This would require additional API calls (playlistItems.list) to map videoId to playlistItemId
        // and then calls to playlistItems.delete. Implementation omitted for complexity and risk.
        // If you need this functionality, you'll need to implement the fetching of playlistItemIds and the delete call.
        // ATENÇÃO: A remoção requer a obtenção do 'playlistItemId' para cada vídeo, não apenas o 'videoId'.
        // Isso exigiria chamadas adicionais à API (playlistItems.list) para mapear videoId para playlistItemId
        // e depois chamadas a playlistItems.delete. Implementação omitida por complexidade e risco.
        // Se precisar desta funcionalidade, precisará implementar a busca de playlistItemIds e a chamada de exclusão.
        Logger.log('Funcionalidade de remoção de vídeos extras não implementada neste script. / Extra video removal functionality not implemented in this script.');
    }
    */

    // --- 4g. Final Log / Log Final ---
    var finalCount = getPlaylistItemCount(service, targetPlaylistId); // Re-check the final count / Re-verifica a contagem final
    Logger.log('--- Resumo Final da Sincronização / Final Sync Summary ---');
    Logger.log(`Canal de Origem / Source Channel (${channelId}): ${sourceVideoIds.length} vídeos encontrados / videos found`);
    Logger.log(`Playlist de Destino / Destination Playlist ("${targetPlaylistTitle}", ${targetPlaylistId}): ${finalCount} vídeos atualmente / videos currently`);
    Logger.log('----------------------------------------');
    if (finalCount < sourceVideoIds.length) {
         Logger.log(`ALERTA / ALERT: Ainda existem ${sourceVideoIds.length - finalCount} vídeos do canal que não estão na playlist (possivelmente devido a erros na adição ou vídeos indisponíveis). / There are still ${sourceVideoIds.length - finalCount} channel videos not in the playlist (possibly due to add errors or unavailable videos).`);
    }
    Logger.log('Sincronização concluída! / Synchronization completed!');

  } catch (error) {
    Logger.log('ERRO GERAL DURANTE A SINCRONIZAÇÃO / GENERAL ERROR DURING SYNC: ' + error.message);
    Logger.log('Stack Trace: ' + error.stack);
    // Try to provide more details if it's an API error
    // Tenta fornecer mais detalhes se for um erro de API
    if (error.details && error.details.message) {
       Logger.log('Detalhes do Erro da API / API Error Details: ' + error.details.message);
    }
  }
}

// =============================================
// ========== HELPER FUNCTIONS / FUNÇÕES AUXILIARES ===============
// =============================================

// --- OAuth2 Authentication / Autenticação OAuth2 ---

/**
 * @description PT-BR: Configura e retorna o serviço OAuth2 para a API do YouTube.
 * @description EN: Configures and returns the OAuth2 service for the YouTube API.
 * @returns {OAuth2.Service} O serviço OAuth2 configurado. / The configured OAuth2 service.
 */
function getYouTubeService() {
  // Fetch script properties for credentials
  // Busca propriedades do script para credenciais
  var props = PropertiesService.getScriptProperties();
  return OAuth2.createService('YouTube')
    // OAuth2 endpoints / Endpoints OAuth2
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    // Client credentials from script properties / Credenciais do cliente das propriedades do script
    .setClientId(props.getProperty('YOUTUBE_CLIENT_ID'))
    .setClientSecret(props.getProperty('YOUTUBE_CLIENT_SECRET'))
    // Callback function name in this script / Nome da função de callback neste script
    .setCallbackFunction('authCallback')
    // Store tokens in script properties / Armazena tokens nas propriedades do script
    .setPropertyStore(props)
    // Required API scope for managing playlists / Escopo da API necessário para gerenciar playlists
    .setScope(['https://www.googleapis.com/auth/youtube.force-ssl'])
    // Request offline access to get a refresh token / Solicita acesso offline para obter um refresh token
    .setParam('access_type', 'offline')
    // Force consent screen to ensure refresh token is granted / Força tela de consentimento para garantir concessão de refresh token
    .setParam('prompt', 'consent');
}

/**
 * @description PT-BR: Função de callback para o fluxo OAuth2. Chamada pelo Google após o usuário autorizar.
 * @description EN: Callback function for the OAuth2 flow. Called by Google after user authorization.
 * @param {object} request O objeto de requisição contendo os parâmetros de callback. / The request object containing callback parameters.
 * @returns {HtmlOutput} Uma página HTML indicando sucesso ou falha na autorização. / An HTML page indicating authorization success or failure.
 */
function authCallback(request) {
  var service = getYouTubeService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    // PT-BR: Sucesso na autorização.
    // EN: Authorization successful.
    return HtmlService.createHtmlOutput('Autorização bem-sucedida! Você pode fechar esta aba e executar o script novamente. / Authorization successful! You can close this tab and run the script again.');
  } else {
    // PT-BR: Falha na autorização.
    // EN: Authorization failed.
    return HtmlService.createHtmlOutput('Falha na autorização. Verifique as configurações de Cliente ID/Secret e tente novamente. / Authorization failed. Check Client ID/Secret settings and try again.');
  }
}

// --- YouTube API Interaction / Interação com API do YouTube ---

/**
 * @description PT-BR: Obtém o ID da playlist "uploads" de um canal específico.
 * @description EN: Gets the ID of the "uploads" playlist for a specific channel.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} channelId O ID do canal do YouTube. / The YouTube channel ID.
 * @returns {string} O ID da playlist de uploads. / The uploads playlist ID.
 * @throws {Error} Se o canal não for encontrado ou a playlist de uploads não puder ser determinada. / If the channel is not found or the uploads playlist cannot be determined.
 */
function getUploadsPlaylistId(service, channelId) {
  var url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`;
  var options = {
    headers: { Authorization: 'Bearer ' + service.getAccessToken() },
    muteHttpExceptions: true // Allows capturing HTTP errors / Permite capturar erros HTTP
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());

  // Check for API errors or no channel found
  // Verifica erros da API ou se o canal não foi encontrado
  if (response.getResponseCode() >= 400 || !result.items || result.items.length === 0) {
    Logger.log(`Erro ao buscar detalhes do canal ${channelId} / Error fetching channel details for ${channelId}: ${response.getContentText()}`);
    throw new Error(`Canal ${channelId} não encontrado ou inacessível. Verifique o ID. / Channel ${channelId} not found or inaccessible. Check the ID.`);
  }

  // Try to extract the uploads playlist ID
  // Tenta extrair o ID da playlist de uploads
  try {
    return result.items[0].contentDetails.relatedPlaylists.uploads;
  } catch (e) {
      Logger.log(`Erro ao extrair ID da playlist de uploads do canal ${channelId}. Resposta / Error extracting uploads playlist ID for channel ${channelId}. Response: ${JSON.stringify(result)}`);
      throw new Error(`Não foi possível encontrar a playlist de uploads para o canal ${channelId}. O canal pode não ter vídeos ou ser inválido. / Could not find the uploads playlist for channel ${channelId}. The channel might have no videos or be invalid.`);
  }
}

/**
 * @description PT-BR: Obtém informações básicas de uma playlist (título, descrição). Lança um erro se não for encontrada ou acessível.
 * @description EN: Gets basic information for a playlist (title, description). Throws an error if not found or accessible.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} playlistId O ID da playlist. / The playlist ID.
 * @returns {object} Um objeto com id, title, e description da playlist. / An object with the playlist's id, title, and description.
 * @throws {Error} Se a playlist não for encontrada ou o usuário não tiver permissão. / If the playlist is not found or the user lacks permission.
 */
function getPlaylistInfo(service, playlistId) {
  var url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}`;
   var options = {
    headers: { Authorization: 'Bearer ' + service.getAccessToken() },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());

  // Check for API errors or playlist not found
  // Verifica erros da API ou se a playlist não foi encontrada
  if (response.getResponseCode() >= 400 || !result.items || result.items.length === 0) {
     Logger.log(`Erro ao buscar informações da playlist ${playlistId} / Error fetching playlist info for ${playlistId}: ${response.getContentText()}`);
     throw new Error(`Playlist com ID ${playlistId} não encontrada ou você não tem permissão para acessá-la. / Playlist with ID ${playlistId} not found or you do not have permission to access it.`);
  }

  return {
    id: playlistId,
    title: result.items[0].snippet.title,
    description: result.items[0].snippet.description
  };
}


/**
 * @description PT-BR: Encontra uma playlist pelo nome na conta do usuário ou cria uma nova se não existir. Usa nomes em PT e EN para a descrição.
 * @description EN: Finds a playlist by name in the user's account or creates a new one if it doesn't exist. Uses PT and EN names for description.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} playlistNamePt Nome da playlist em Português para procurar/criar. / Playlist name in Portuguese to search/create.
 * @param {string} playlistNameEn Nome da playlist em Inglês para usar na descrição se criar. / Playlist name in English to use in description if creating.
 * @returns {string} O ID da playlist encontrada ou criada. / The ID of the found or created playlist.
 * @throws {Error} Se ocorrer um erro ao listar ou criar playlists. / If an error occurs while listing or creating playlists.
 */
function findOrCreatePlaylist(service, playlistNamePt, playlistNameEn) {
  var nextPageToken = null;
  var foundPlaylistId = null;

  Logger.log(`Procurando por playlist existente com nome (PT) "${playlistNamePt}"... / Searching for existing playlist with name (PT) "${playlistNamePt}"...`);

  // Loop to search through all pages of the user's playlists
  // Loop para buscar em todas as páginas de playlists do usuário
  do {
    var url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50` + (nextPageToken ? `&pageToken=${nextPageToken}` : '');
    var options = {
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());

    // Handle errors during playlist listing
    // Trata erros durante a listagem de playlists
    if (response.getResponseCode() >= 400) {
       Logger.log(`Erro ao buscar playlists do usuário / Error fetching user playlists: ${response.getContentText()}`);
       throw new Error('Não foi possível listar suas playlists. / Could not list your playlists.');
    }

    // Search for the playlist by Portuguese name in the current page results
    // Procura pela playlist pelo nome em português nos resultados da página atual
    if (result.items) {
      var playlist = result.items.find(p => p.snippet.title === playlistNamePt);
      if (playlist) {
        foundPlaylistId = playlist.id;
        Logger.log(`Playlist "${playlistNamePt}" encontrada com ID / found with ID: ${foundPlaylistId}`);
        break; // Exit loop if found / Sai do loop se encontrou
      }
    }
    nextPageToken = result.nextPageToken;
    if (nextPageToken) Utilities.sleep(200); // Short pause between pages / Pequena pausa entre páginas

  } while (nextPageToken && !foundPlaylistId);


  // If not found, create the playlist
  // Se não encontrou, cria a playlist
  if (!foundPlaylistId) {
    Logger.log(`Playlist "${playlistNamePt}" não encontrada. Criando uma nova... / Playlist "${playlistNamePt}" not found. Creating a new one...`);
    var createUrl = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status';
    var createOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      muteHttpExceptions: true,
      payload: JSON.stringify({
        snippet: {
          title: playlistNamePt, // Create with Portuguese name / Cria com nome em português
          description: `PT: Playlist sincronizada automaticamente com vídeos do canal. Criada em ${new Date().toLocaleDateString()}. / EN: Playlist automatically synced with channel videos. Created on ${new Date().toLocaleDateString()}. (Using name: ${playlistNameEn})`
        },
        status: { privacyStatus: 'private' } // 'public', 'private', or 'unlisted'
      })
    };
    var createResponse = UrlFetchApp.fetch(createUrl, createOptions);
    var createResult = JSON.parse(createResponse.getContentText());

     // Handle playlist creation errors
     // Trata erros na criação da playlist
     if (createResponse.getResponseCode() >= 300 || !createResult.id) {
       Logger.log(`Erro ao criar playlist "${playlistNamePt}" / Error creating playlist "${playlistNamePt}": ${createResponse.getContentText()}`);
       throw new Error(`Falha ao criar a playlist "${playlistNamePt}". / Failed to create playlist "${playlistNamePt}".`);
     }
     foundPlaylistId = createResult.id;
     Logger.log(`Playlist "${playlistNamePt}" criada com sucesso! ID / created successfully! ID: ${foundPlaylistId}`);
  }

  return foundPlaylistId;
}

/**
 * @description PT-BR: Obtém a contagem total de itens em uma playlist usando `pageInfo.totalResults`.
 * @description EN: Gets the total item count in a playlist using `pageInfo.totalResults`.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} playlistId O ID da playlist. / The playlist ID.
 * @returns {number} O número total de itens na playlist, ou 0 em caso de erro. / The total number of items in the playlist, or 0 on error.
 */
function getPlaylistItemCount(service, playlistId) {
  // Use maxResults=1 for optimization, we only need pageInfo.totalResults
  // Usamos maxResults=1 para otimizar, só precisamos do pageInfo.totalResults
  var url = `https://www.googleapis.com/youtube/v3/playlistItems?part=id&playlistId=${playlistId}&maxResults=1`;
  var options = {
    headers: { Authorization: 'Bearer ' + service.getAccessToken() },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());

   // Handle errors fetching item count
   // Trata erros ao buscar contagem de itens
   if (response.getResponseCode() >= 400) {
      Logger.log(`Erro ao obter contagem de itens da playlist ${playlistId} / Error getting item count for playlist ${playlistId}: ${response.getContentText()}`);
      // Return 0 on error, but log the issue. Could throw error if preferred.
      // Retorna 0 em caso de erro, mas loga o problema. Poderia lançar erro se preferir.
      return 0;
   }

  return result.pageInfo ? result.pageInfo.totalResults : 0;
}


/**
 * @description PT-BR: Obtém TODOS os IDs de vídeo de uma playlist, lidando com paginação e retentativas básicas. Usa um Set para evitar duplicatas.
 * @description EN: Gets ALL video IDs from a playlist, handling pagination and basic retries. Uses a Set to avoid duplicates.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} playlistId O ID da playlist. / The playlist ID.
 * @returns {string[]} Um array de IDs de vídeo únicos. / An array of unique video IDs.
 */
function getAllVideoIds(service, playlistId) {
  var allVideoIds = new Set(); // Use Set to handle duplicates automatically / Usa Set para lidar com duplicatas automaticamente
  var nextPageToken = null;
  var pageCount = 0;
  var maxPages = 200; // Limit to prevent infinite loops in huge playlists or errors / Limite para evitar loops infinitos em playlists gigantescas ou erros

  Logger.log(`Buscando IDs de vídeo da playlist ${playlistId}... (Isso pode levar tempo) / Fetching video IDs from playlist ${playlistId}... (This may take time)`);

  do {
    pageCount++;
    if (pageCount > maxPages) {
        Logger.log(`AVISO / WARNING: Limite de ${maxPages} páginas atingido ao buscar vídeos da playlist ${playlistId}. Pode haver vídeos faltando. / Page limit of ${maxPages} reached fetching videos from playlist ${playlistId}. Some videos might be missing.`);
        break;
    }

    var url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50` + (nextPageToken ? `&pageToken=${nextPageToken}` : '');
    var options = {
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      muteHttpExceptions: true
    };

    var response;
    var result;
    var attempt = 0;
    var maxAttempts = 3; // Number of retry attempts / Número de tentativas
    var success = false;

    // Retry fetching the page a few times in case of temporary errors
    // Tentar buscar a página algumas vezes em caso de erro temporário
    while(attempt < maxAttempts && !success) {
        attempt++;
        try {
            response = UrlFetchApp.fetch(url, options);
            result = JSON.parse(response.getContentText());

            if (response.getResponseCode() < 400) {
                success = true; // Fetch successful / Busca bem-sucedida
            } else {
                 Logger.log(`Erro ${response.getResponseCode()} ao buscar página ${pageCount} da playlist ${playlistId} (Tentativa ${attempt}/${maxAttempts}) / Error ${response.getResponseCode()} fetching page ${pageCount} of playlist ${playlistId} (Attempt ${attempt}/${maxAttempts}): ${response.getContentText()}`);
                 if (response.getResponseCode() == 404) { // Playlist not found (maybe deleted) / Playlist não encontrada (pode ter sido excluída)
                      Logger.log(`ERRO / ERROR: Playlist ${playlistId} não encontrada (404). Interrompendo busca. / Playlist ${playlistId} not found (404). Stopping search.`);
                      return Array.from(allVideoIds); // Return what was found so far / Retorna o que encontrou até agora
                 }
                 if (attempt < maxAttempts) Utilities.sleep(1500 * attempt); // Exponential backoff / Backoff exponencial
            }
        } catch (e) {
            Logger.log(`Exceção ao buscar página ${pageCount} da playlist ${playlistId} (Tentativa ${attempt}/${maxAttempts}) / Exception fetching page ${pageCount} of playlist ${playlistId} (Attempt ${attempt}/${maxAttempts}): ${e.message}`);
             if (attempt < maxAttempts) Utilities.sleep(2000 * attempt); // Backoff
        }
    }

    if (!success) {
        Logger.log(`ERRO / ERROR: Falha ao buscar página ${pageCount} da playlist ${playlistId} após ${maxAttempts} tentativas. Interrompendo busca. / Failed to fetch page ${pageCount} of playlist ${playlistId} after ${maxAttempts} attempts. Stopping search.`);
        break; // Stop the main loop if the page fetch fails repeatedly / Interrompe o loop principal se a busca da página falhar repetidamente
    }

    // Process items from the page / Processar itens da página
    if (result.items && result.items.length > 0) {
      result.items.forEach(item => {
        // Check if item has necessary info / Verifica se o item tem as informações necessárias
        if (item.snippet && item.snippet.resourceId && item.snippet.resourceId.kind === 'youtube#video' && item.snippet.resourceId.videoId) {
          // Best effort check for private/deleted videos / Melhor esforço para checar vídeos privados/excluídos
          // Note: 'title' and 'description' might be "[Private video]" or "[Deleted video]" / Nota: 'title' e 'description' podem ser "[Private video]" ou "[Deleted video]"
          // This is not 100% guaranteed; adding might fail later. / Isso não é 100% garantido; a adição pode falhar depois.
          if (item.snippet.title !== '[Private video]' && item.snippet.title !== '[Deleted video]') {
               allVideoIds.add(item.snippet.resourceId.videoId);
          } else {
               Logger.log(`- Vídeo ${item.snippet.resourceId.videoId} pulado (privado/excluído) na playlist ${playlistId}. / Video ${item.snippet.resourceId.videoId} skipped (private/deleted) in playlist ${playlistId}.`);
          }
        } else {
           // Logger.log(`- Item inválido encontrado na página ${pageCount} da playlist ${playlistId}: ${JSON.stringify(item)} / Invalid item found on page ${pageCount} of playlist ${playlistId}: ${JSON.stringify(item)}`);
        }
      });
       Logger.log(`  Pagina ${pageCount}: ${result.items.length} itens processados / items processed, Total IDs únicos / unique IDs: ${allVideoIds.size}`);
    } else {
       Logger.log(`  Pagina ${pageCount}: Nenhum item encontrado / No items found.`);
    }

    nextPageToken = result.nextPageToken;

    // Pause between pages to avoid API rate limits / Pausa entre páginas para evitar limites de taxa da API
    if (nextPageToken) {
      Utilities.sleep(500); // 500ms pause / 500ms de pausa
    }

  } while (nextPageToken);

  Logger.log(`Busca concluída para playlist ${playlistId}. Total de IDs válidos / Search complete for playlist ${playlistId}. Total valid video IDs found: ${allVideoIds.size}`);
  return Array.from(allVideoIds); // Convert Set back to Array / Converte o Set de volta para Array
}


/**
 * @description PT-BR: Adiciona uma lista de IDs de vídeo a uma playlist. Tenta adicionar um por um com retentativas e pausas.
 * @description EN: Adds a list of video IDs to a playlist. Tries adding one by one with retries and pauses.
 * @param {OAuth2.Service} service O serviço OAuth2 autenticado. / The authenticated OAuth2 service.
 * @param {string} playlistId O ID da playlist de destino. / The destination playlist ID.
 * @param {string[]} videoIds Um array de IDs de vídeo para adicionar. / An array of video IDs to add.
 * @returns {number} A contagem de vídeos adicionados com sucesso. / The count of successfully added videos.
 */
function addVideosToPlaylist(service, playlistId, videoIds) {
  var addedCount = 0;
  var errorCount = 0;
  var totalToAdd = videoIds.length;

  Logger.log(`Iniciando adição de ${totalToAdd} vídeos à playlist ${playlistId}... / Starting addition of ${totalToAdd} videos to playlist ${playlistId}...`);

  videoIds.forEach((videoId, index) => {
    var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet';
    var payload = {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId
        }
        // position: 0 // Optional: Add to the beginning of the playlist / Opcional: Adiciona no início da playlist
      }
    };
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response;
    var result;
    var attempt = 0;
    var maxAttempts = 2; // Fewer retries for adding / Menos tentativas para adição
    var success = false;

     // Retry adding a few times in case of temporary errors
     // Tentar adicionar algumas vezes em caso de erro temporário
    while(attempt < maxAttempts && !success) {
        attempt++;
        try {
            response = UrlFetchApp.fetch(url, options);
            result = JSON.parse(response.getContentText());

            // Check for success (2xx status code and an ID in the response)
            // Verifica sucesso (código 2xx e um ID na resposta)
            if (response.getResponseCode() >= 200 && response.getResponseCode() < 300 && result.id) {
                addedCount++;
                success = true;
                // Logger.log(`  [${index + 1}/${totalToAdd}] Sucesso / Success: ${videoId}`);
            } else {
                 // Log detailed error only on last attempt or if it's not a quota error (to avoid spam)
                 // Log detalhado do erro apenas na última tentativa ou se não for erro de cota (para evitar spam)
                 if (attempt === maxAttempts || (result.error && result.error.errors && result.error.errors[0].reason !== 'quotaExceeded')) {
                    var errorMsg = result.error ? result.error.message : `Código / Code ${response.getResponseCode()}`;
                    var reason = (result.error && result.error.errors) ? result.error.errors[0].reason : 'unknown';
                    Logger.log(`  [${index + 1}/${totalToAdd}] FALHA / FAILED ${videoId} (Tentativa / Attempt ${attempt}/${maxAttempts}): ${errorMsg} (Reason: ${reason})`);
                 }
                 // Longer pause on error, especially quota exceeded
                 // Pausa maior em caso de erro, especialmente cota excedida
                 Utilities.sleep(1500 * attempt);
            }
        } catch (e) {
             Logger.log(`  [${index + 1}/${totalToAdd}] EXCEÇÃO / EXCEPTION ${videoId} (Tentativa / Attempt ${attempt}/${maxAttempts}): ${e.message}`);
             Utilities.sleep(2000 * attempt);
        }
    }

    if (!success) {
        errorCount++;
    }

    // Short pause between additions to avoid overwhelming the API
    // Increase pause if many recent errors occurred (suggests quota issues)
    // Pausa curta entre adições para não sobrecarregar a API
    // Aumenta a pausa se houver muitos erros recentes (sugere limite de cota)
    var sleepTime = (errorCount > 5 && errorCount % 5 === 0) ? 5000 : 500;
    Utilities.sleep(sleepTime);

     // Log progress every 20 videos or at the end
     // Log de progresso a cada 20 vídeos ou no final
     if ((index + 1) % 20 === 0 || index === totalToAdd - 1) {
        Logger.log(`  Progresso / Progress: ${index + 1}/${totalToAdd} processados / processed. ${addedCount} adicionados / added, ${errorCount} falhas / failures.`);
     }

  }); // End forEach loop / Fim do loop forEach

  Logger.log(`Adição concluída para playlist ${playlistId}. ${addedCount} vídeos adicionados / videos added, ${errorCount} falhas / failures.`);
  return addedCount;
}


// --- Web App Handler (Optional) / Handler para Web App (Opcional) ---

/**
 * @description PT-BR: Handler para quando o script é acessado como um Web App (via GET). Chama a função principal de sincronização.
 * @description EN: Handler for when the script is accessed as a Web App (via GET). Calls the main sync function.
 * @param {object} e O objeto de evento do Apps Script (pode conter parâmetros de URL). / The Apps Script event object (may contain URL parameters).
 * @returns {HtmlOutput} Uma resposta HTML simples indicando que o processo foi iniciado. / A simple HTML response indicating the process has started.
 */
function doGet(e) {
  // Log that the web app endpoint was hit
  // Registra que o endpoint do web app foi acessado
  Logger.log('Recebida solicitação via doGet (Web App). Iniciando runSyncProcess... / Received request via doGet (Web App). Starting runSyncProcess...');

  // Call the main sync function
  // Chama a função principal de sincronização
  runSyncProcess();

  // Return a simple HTML confirmation. Detailed logs are in the script editor.
  // Retorna uma confirmação HTML simples. Logs detalhados estão no editor de scripts.
  return HtmlService.createHtmlOutput("<p>Processo de sincronização iniciado. Verifique os logs no editor de scripts para detalhes. / Sync process started. Check logs in the script editor for details.</p>");
}