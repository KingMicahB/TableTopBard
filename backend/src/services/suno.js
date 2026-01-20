import { config } from '../config/env.js';

const SUNO_API_BASE_URL = 'https://api.sunoapi.org';

/**
 * Poll for music generation status
 * @param {string} taskId - Task ID from initial generation request
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} pollInterval - Interval between polls in milliseconds
 * @returns {Promise<Object>} - Music generation result with audio URLs
 */
const pollForCompletion = async (taskId, maxAttempts = 60, pollInterval = 15000) => {
  const startTime = Date.now();
  console.log(`[POLLING START] Task ID: ${taskId}`);
  console.log(`[POLLING START] Max attempts: ${maxAttempts}, Poll interval: ${pollInterval}ms`);
  console.log(`[POLLING START] Polling URL: ${SUNO_API_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptStartTime = Date.now();
    try {
      console.log(`\n[POLL ATTEMPT ${attempt + 1}/${maxAttempts}] Task: ${taskId}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] Elapsed time: ${Math.round((attemptStartTime - startTime) / 1000)}s`);
      
      const pollUrl = `${SUNO_API_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`;
      console.log(`[POLL ATTEMPT ${attempt + 1}] Fetching: ${pollUrl}`);
      
      // Use trimmed API key for the actual request
      const trimmedApiKey = config.sunoApiKey.trim();
      
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`[POLL ATTEMPT ${attempt + 1}] Response status: ${response.status} ${response.statusText}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[POLL ATTEMPT ${attempt + 1}] ❌ HTTP Error: ${response.status} ${response.statusText}`);
        console.error(`[POLL ATTEMPT ${attempt + 1}] Error response body:`, errorText);
        throw new Error(`Suno API error (${response.status}): ${errorText || response.statusText}`);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log(`[POLL ATTEMPT ${attempt + 1}] Response body length: ${responseText?.length || 0} characters`);
      
      if (!responseText || responseText.trim().length === 0) {
        console.warn(`[POLL ATTEMPT ${attempt + 1}] ⚠️ Empty response body`);
        // Empty response, might still be processing
        if (attempt < maxAttempts - 1) {
          console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${pollInterval}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          throw new Error('Empty response from Suno API');
        }
      }

      let data;
      try {
        console.log(`[POLL ATTEMPT ${attempt + 1}] Parsing JSON response...`);
        data = JSON.parse(responseText);
        console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ JSON parsed successfully`);
      } catch (parseError) {
        console.error(`[POLL ATTEMPT ${attempt + 1}] ❌ Failed to parse JSON:`, parseError.message);
        console.error(`[POLL ATTEMPT ${attempt + 1}] Raw response (first 500 chars):`, responseText.substring(0, 500));
        // If it's not the last attempt, continue polling
        if (attempt < maxAttempts - 1) {
          console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${pollInterval}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          throw new Error(`Invalid JSON response from Suno API: ${parseError.message}`);
        }
      }

      // Log full response structure for debugging
      console.log(`[POLL ATTEMPT ${attempt + 1}] Full response structure:`);
      console.log(JSON.stringify(data, null, 2));

      // Check various possible status values - according to docs, status is uppercase
      // Try multiple nested paths: data.status, data.response.status, data.data.status, etc.
      // Note: Based on actual API response, status can be at data.status or data.data.status
      console.log(`[POLL ATTEMPT ${attempt + 1}] Checking status in multiple locations...`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.status: ${data.status || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.status: ${data.data?.status || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.status: ${data.response?.status || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.task_status: ${data.task_status || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.state: ${data.state || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.state: ${data.response?.state || 'NOT FOUND'}`);
      console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.state: ${data.data?.state || 'NOT FOUND'}`);
      
      // Check data.data.status first (polling response structure), then data.status (initial response structure)
      const status = data.data?.status
        || data.status 
        || data.response?.status 
        || data.task_status 
        || data.state
        || data.response?.state
        || data.data?.state;
      
      // Normalize status to uppercase for comparison (handle both cases)
      const normalizedStatus = status ? String(status).toUpperCase() : null;
      
      console.log(`[POLL ATTEMPT ${attempt + 1}] Selected status: ${status || 'NULL'} → Normalized: ${normalizedStatus || 'NULL'}`);
      
      // Log status for debugging
      if (normalizedStatus && normalizedStatus !== 'PROCESSING' && normalizedStatus !== 'PENDING') {
        console.log(`[POLL ATTEMPT ${attempt + 1}] 📊 Status: ${normalizedStatus} (raw: ${status})`);
      } else if (normalizedStatus) {
        console.log(`[POLL ATTEMPT ${attempt + 1}] ⏳ Status: ${normalizedStatus} (still processing)`);
      } else {
        console.warn(`[POLL ATTEMPT ${attempt + 1}] ⚠️ No status found in response!`);
      }
      
      // Check if task is complete - according to docs: SUCCESS, FIRST_SUCCESS, TEXT_SUCCESS
      // SUCCESS = fully complete, FIRST_SUCCESS = first song ready (might have 2 songs)
      if (normalizedStatus === 'SUCCESS' || normalizedStatus === 'FIRST_SUCCESS' || normalizedStatus === 'TEXT_SUCCESS') {
        console.log(`[POLL ATTEMPT ${attempt + 1}] ✅ Task completed with status: ${normalizedStatus}`);
        
        // Try multiple nested paths for song data
        // Structure could be: data.data, data.response.sunoData, data.sunoData, data.data.data, etc.
        console.log(`[POLL ATTEMPT ${attempt + 1}] Searching for song data in response...`);
        
        let songsData = null;
        let sunoData = null;
        
        // Check for nested sunoData structure (as mentioned in docs)
        // Based on actual API response: songs are in data.data.response.sunoData (polling) or data.response.sunoData (initial)
        console.log(`[POLL ATTEMPT ${attempt + 1}] Checking for sunoData...`);
        const dataResponseSunoData = data.data?.response?.sunoData;
        const responseSunoData = data.response?.sunoData;
        const sunoDataCheck = data.sunoData;
        const dataSunoData = data.data?.sunoData;
        const responseDataSunoData = data.response?.data?.sunoData;
        
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.response?.sunoData: ${dataResponseSunoData ? (Array.isArray(dataResponseSunoData) ? `FOUND (${dataResponseSunoData.length} items)` : 'FOUND (object)') : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.sunoData: ${responseSunoData ? (Array.isArray(responseSunoData) ? `FOUND (${responseSunoData.length} items)` : 'FOUND (object)') : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.sunoData: ${sunoDataCheck ? (Array.isArray(sunoDataCheck) ? `FOUND (${sunoDataCheck.length} items)` : 'FOUND (object)') : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.sunoData: ${dataSunoData ? (Array.isArray(dataSunoData) ? `FOUND (${dataSunoData.length} items)` : 'FOUND (object)') : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.data?.sunoData: ${responseDataSunoData ? (Array.isArray(responseDataSunoData) ? `FOUND (${responseDataSunoData.length} items)` : 'FOUND (object)') : 'NOT FOUND'}`);
        
        // Check data.data.response.sunoData first (polling response), then data.response.sunoData (initial response)
        sunoData = dataResponseSunoData || responseSunoData || sunoDataCheck || dataSunoData || responseDataSunoData;
        if (sunoData) {
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found sunoData:`, typeof sunoData, Array.isArray(sunoData) ? `(array, length: ${sunoData.length})` : '(object)');
        }
        
        // Check for array of songs in various locations
        // Based on actual API response: songs are in data.data.response.sunoData (polling) or data.response.sunoData (initial)
        console.log(`[POLL ATTEMPT ${attempt + 1}] Checking for songs array...`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.response?.sunoData: ${Array.isArray(data.data?.response?.sunoData) ? `FOUND (${data.data.response.sunoData.length} items)` : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.sunoData: ${Array.isArray(data.response?.sunoData) ? `FOUND (${data.response.sunoData.length} items)` : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data?.data: ${Array.isArray(data.data?.data) ? `FOUND (${data.data.data.length} items)` : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.data: ${Array.isArray(data.data) ? `FOUND (${data.data.length} items)` : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.songs: ${Array.isArray(data.songs) ? `FOUND (${data.songs.length} items)` : 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.data: ${Array.isArray(data.response?.data) ? `FOUND (${data.response.data.length} items)` : 'NOT FOUND'}`);
        
        // Check data.data.response.sunoData first (polling response structure), then data.response.sunoData (initial response structure)
        if (Array.isArray(data.data?.response?.sunoData)) {
          songsData = data.data.response.sunoData;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.data.response.sunoData (${songsData.length} songs)`);
        } else if (Array.isArray(data.response?.sunoData)) {
          songsData = data.response.sunoData;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.response.sunoData (${songsData.length} songs)`);
        } else if (Array.isArray(data.data?.data)) {
          songsData = data.data.data;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.data.data (${songsData.length} songs)`);
        } else if (Array.isArray(data.data)) {
          songsData = data.data;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.data (${songsData.length} songs)`);
        } else if (Array.isArray(data.songs)) {
          songsData = data.songs;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.songs (${songsData.length} songs)`);
        } else if (Array.isArray(data.response?.data)) {
          songsData = data.response.data;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in data.response.data (${songsData.length} songs)`);
        } else if (sunoData) {
          // If sunoData exists, it might contain the songs
          if (Array.isArray(sunoData)) {
            songsData = sunoData;
            console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in sunoData array (${songsData.length} songs)`);
          } else if (Array.isArray(sunoData.data)) {
            songsData = sunoData.data;
            console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found songs in sunoData.data (${songsData.length} songs)`);
          }
        }
        
        if (!songsData) {
          console.warn(`[POLL ATTEMPT ${attempt + 1}] ⚠️ No songs array found in any expected location`);
        }
        
        // If we found songs array, process them
        if (Array.isArray(songsData) && songsData.length > 0) {
          console.log(`[POLL ATTEMPT ${attempt + 1}] 🎵 Found ${songsData.length} song(s) in response`);
          console.log(`[POLL ATTEMPT ${attempt + 1}] Processing songs...`);
          
          // Process both songs
          const songs = songsData.map((song, index) => {
            console.log(`[POLL ATTEMPT ${attempt + 1}] Song ${index + 1} structure:`, Object.keys(song));
            const processedSong = {
              id: song.id || song.taskId,
              // Check both camelCase and snake_case versions, and source URLs
              audio_url: song.audioUrl || song.audio_url || song.sourceAudioUrl || song.source_audio_url,
              stream_audio_url: song.streamAudioUrl || song.stream_audio_url || song.sourceStreamAudioUrl || song.source_stream_audio_url,
              image_url: song.imageUrl || song.image_url || song.sourceImageUrl || song.source_image_url,
              prompt: song.prompt,
              title: song.title,
              tags: song.tags,
              model_name: song.modelName || song.model_name,
              duration: song.duration,
              createTime: song.createTime || song.create_time,
            };
            console.log(`[POLL ATTEMPT ${attempt + 1}] Song ${index + 1} processed:`, {
              id: processedSong.id,
              title: processedSong.title,
              has_audio_url: !!processedSong.audio_url,
              has_stream_url: !!processedSong.stream_audio_url,
            });
            return processedSong;
          });
          
          const totalTime = Math.round((Date.now() - startTime) / 1000);
          console.log(`[POLLING COMPLETE] ✅ Successfully retrieved ${songs.length} song(s) in ${totalTime}s`);
          console.log(`[POLLING COMPLETE] First song URL: ${songs[0]?.audio_url || songs[0]?.stream_audio_url}`);
          
          return {
            success: true,
            taskId: taskId,
            songs: songs,
            // For backwards compatibility, also provide first song's URL
            audioUrl: songs[0]?.audio_url || songs[0]?.stream_audio_url,
            streamUrl: songs[0]?.stream_audio_url,
            status: normalizedStatus,
          };
        }
        
        // Fallback: Try to get single audio URL from various nested paths
        console.log(`[POLL ATTEMPT ${attempt + 1}] No songs array found, checking for single audio URL...`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] Checking audio URL locations...`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.audioUrl: ${data.audioUrl || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.audioUrl: ${data.response?.audioUrl || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - sunoData?.audioUrl: ${sunoData?.audioUrl || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.audio_url: ${data.audio_url || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.audio: ${data.audio || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.url: ${data.url || 'NOT FOUND'}`);
        console.log(`[POLL ATTEMPT ${attempt + 1}] - data.response?.url: ${data.response?.url || 'NOT FOUND'}`);
        
        const audioUrl = data.audioUrl 
          || data.response?.audioUrl
          || sunoData?.audioUrl
          || data.audio_url 
          || data.audio 
          || data.url
          || data.response?.url;
        const streamUrl = data.streamUrl 
          || data.response?.streamUrl
          || sunoData?.streamUrl
          || data.stream_url 
          || data.stream;
        const downloadUrl = data.downloadUrl 
          || data.response?.downloadUrl
          || sunoData?.downloadUrl
          || data.download_url 
          || data.download;
        
        if (audioUrl || streamUrl || downloadUrl) {
          const foundUrl = audioUrl || streamUrl || downloadUrl;
          console.log(`[POLL ATTEMPT ${attempt + 1}] ✓ Found audio URL: ${foundUrl}`);
          const totalTime = Math.round((Date.now() - startTime) / 1000);
          console.log(`[POLLING COMPLETE] ✅ Successfully retrieved audio URL in ${totalTime}s`);
          return {
            success: true,
            taskId: taskId,
            audioUrl: foundUrl,
            streamUrl: streamUrl,
            downloadUrl: downloadUrl,
            title: data.title || data.response?.title || data.song_title,
            imageUrl: data.imageUrl || data.response?.imageUrl || data.image_url || data.image || data.cover,
            duration: data.duration || data.response?.duration || data.length,
            status: normalizedStatus,
          };
        }
        
        // If status is SUCCESS but no URLs found, might still be processing
        // FIRST_SUCCESS might mean first song is ready but second is still processing
        if (normalizedStatus === 'FIRST_SUCCESS' || normalizedStatus === 'TEXT_SUCCESS') {
          console.log(`[POLL ATTEMPT ${attempt + 1}] ⚠️ Status is ${normalizedStatus} but no audio URLs found yet, continuing to poll...`);
          if (attempt < maxAttempts - 1) {
            console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${pollInterval}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }
        }
        
        // If we have SUCCESS status but no URLs, log the full response for debugging
        console.error(`[POLL ATTEMPT ${attempt + 1}] ❌ Status is ${normalizedStatus} but no audio URLs found!`);
        console.error(`[POLL ATTEMPT ${attempt + 1}] Full response structure:`, JSON.stringify(data, null, 2));
        if (attempt < maxAttempts - 1) {
          console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${pollInterval}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          throw new Error(`Music generation completed (${normalizedStatus}) but no audio URL was provided`);
        }
      }

      // Check if task failed - according to docs: CREATE_TASK_FAILED, GENERATE_AUDIO_FAILED, SENSITIVE_WORD_ERROR, etc.
      if (normalizedStatus && (
        normalizedStatus.includes('FAILED') || 
        normalizedStatus.includes('ERROR') ||
        normalizedStatus === 'FAILED' ||
        normalizedStatus === 'ERROR'
      )) {
        console.error(`[POLL ATTEMPT ${attempt + 1}] ❌ Task failed with status: ${normalizedStatus}`);
        const errorMsg = data.message || data.msg || data.error || data.response?.message || `Music generation failed with status: ${normalizedStatus}`;
        console.error(`[POLL ATTEMPT ${attempt + 1}] Error message: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Log progress for debugging
      if (data.progress || data.percentage || data.response?.progress) {
        const progress = data.progress || data.percentage || data.response?.progress;
        console.log(`[POLL ATTEMPT ${attempt + 1}] 📊 Progress: ${progress}%`);
      } else if (normalizedStatus === 'PENDING' || !normalizedStatus) {
        // Task is still processing
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`[POLL ATTEMPT ${attempt + 1}] ⏳ Task still pending/processing... (${elapsed}s elapsed)`);
      }

      // Task is still processing, wait and poll again
      if (attempt < maxAttempts - 1) {
        const waitTime = pollInterval;
        console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${waitTime}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      console.error(`[POLL ATTEMPT ${attempt + 1}] ❌ Error occurred:`, error.message);
      console.error(`[POLL ATTEMPT ${attempt + 1}] Error stack:`, error.stack);
      // If it's the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        console.error(`[POLLING FAILED] ❌ Final attempt failed after ${totalTime}s`);
        throw error;
      }
      // Otherwise wait and retry
      console.log(`[POLL ATTEMPT ${attempt + 1}] Waiting ${pollInterval}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.error(`[POLLING TIMEOUT] ❌ Exceeded max attempts (${maxAttempts}) after ${totalTime}s`);
  throw new Error('Music generation timed out. Please try again.');
};

/**
 * Poll for music generation status (exported for manual polling)
 * @param {string} taskId - Task ID from initial generation request
 * @param {number} maxAttempts - Maximum polling attempts (default: 1 for single poll)
 * @param {number} pollInterval - Interval between polls in milliseconds (default: 15000)
 * @returns {Promise<Object>} - Music generation result with audio URLs
 */
export const pollMusicStatus = async (taskId, maxAttempts = 1, pollInterval = 15000) => {
  return await pollForCompletion(taskId, maxAttempts, pollInterval);
};

/**
 * Generate music using Suno API
 * 
 * @param {string} prompt - Music generation prompt
 * @param {Object} options - Optional parameters
 * @param {string} options.model - Model version (V5, V4_5PLUS, V4_5, V4, V3_5)
 * @param {boolean} options.instrumental - Whether to generate instrumental only
 * @param {boolean} options.customMode - Whether to use custom mode
 * @param {string} options.style - Style/genre (required if customMode is true)
 * @param {string} options.title - Title (required if customMode is true)
 * @returns {Promise<Object>} - Object containing audio file URLs and metadata
 */
export const generateMusic = async (prompt, options = {}) => {
  console.log(`\n[GENERATE MUSIC] ========================================`);
  console.log(`[GENERATE MUSIC] Starting music generation request`);
  console.log(`[GENERATE MUSIC] Timestamp: ${new Date().toISOString()}`);
  
  if (!config.sunoApiKey || config.sunoApiKey === 'placeholder' || !config.sunoApiKey.trim()) {
    console.error(`[GENERATE MUSIC] ❌ Suno API key is not configured`);
    throw new Error('Suno API key is not configured');
  }
  
  // Validate API key format
  const apiKeyLength = config.sunoApiKey.trim().length;
  const apiKeyPrefix = config.sunoApiKey.trim().substring(0, 10);
  console.log(`[GENERATE MUSIC] ✓ API key configured`);
  console.log(`[GENERATE MUSIC] API key length: ${apiKeyLength} characters`);
  console.log(`[GENERATE MUSIC] API key prefix: ${apiKeyPrefix}...`);
  
  // Check for common issues
  if (apiKeyLength < 10) {
    console.warn(`[GENERATE MUSIC] ⚠️ API key seems too short (${apiKeyLength} chars). Expected length is typically 32+ characters.`);
  }
  if (config.sunoApiKey.includes(' ') || config.sunoApiKey.includes('\n') || config.sunoApiKey.includes('\r')) {
    console.warn(`[GENERATE MUSIC] ⚠️ API key may contain whitespace. Make sure to trim it.`);
  }

  if (!prompt || prompt.trim().length === 0) {
    console.error(`[GENERATE MUSIC] ❌ Prompt is empty`);
    throw new Error('Prompt is required for music generation');
  }
  console.log(`[GENERATE MUSIC] Prompt length: ${prompt.length} characters`);
  console.log(`[GENERATE MUSIC] Prompt preview: ${prompt.substring(0, 100)}...`);

  const {
    model = 'V5',
    instrumental = false,
    customMode = false,
    style = '',
    title = '',
  } = options;
  
  console.log(`[GENERATE MUSIC] Options:`, {
    model,
    instrumental,
    customMode,
    style: style ? `${style.substring(0, 50)}...` : '(empty)',
    title: title ? `${title.substring(0, 50)}...` : '(empty)',
  });

  // Validate custom mode requirements
  if (customMode) {
    console.log(`[GENERATE MUSIC] Validating custom mode requirements...`);
    if (!style || style.trim().length === 0) {
      console.error(`[GENERATE MUSIC] ❌ Style is required when customMode is enabled`);
      throw new Error('Style is required when customMode is enabled');
    }
    if (!title || title.trim().length === 0) {
      console.error(`[GENERATE MUSIC] ❌ Title is required when customMode is enabled`);
      throw new Error('Title is required when customMode is enabled');
    }
    console.log(`[GENERATE MUSIC] ✓ Custom mode requirements validated`);
  }

  try {
    // Step 1: Submit generation request
    // Note: Suno API requires callBackUrl, but we use polling instead of webhooks
    // We'll provide a placeholder callback URL since we poll for status
    // Validate prompt length based on mode
    console.log(`[GENERATE MUSIC] Validating prompt length...`);
    const trimmedPrompt = prompt.trim();
    if (customMode) {
      // Custom mode: 3000 chars for V4, 5000 for others
      const maxLength = model === 'V4' ? 3000 : 5000;
      console.log(`[GENERATE MUSIC] Custom mode - max length: ${maxLength} chars (model: ${model})`);
      if (trimmedPrompt.length > maxLength) {
        console.error(`[GENERATE MUSIC] ❌ Prompt too long: ${trimmedPrompt.length} > ${maxLength}`);
        throw new Error(`Prompt is too long. Maximum ${maxLength} characters for ${model} in custom mode. Current: ${trimmedPrompt.length} characters.`);
      }
    } else {
      // Non-custom mode: max 500 characters
      console.log(`[GENERATE MUSIC] Non-custom mode - max length: 500 chars`);
      if (trimmedPrompt.length > 500) {
        console.error(`[GENERATE MUSIC] ❌ Prompt too long: ${trimmedPrompt.length} > 500`);
        throw new Error(`Prompt is too long. Maximum 500 characters for non-custom mode. Current: ${trimmedPrompt.length} characters.`);
      }
    }
    console.log(`[GENERATE MUSIC] ✓ Prompt length validated: ${trimmedPrompt.length} chars`);

    const requestBody = {
      prompt: trimmedPrompt,
      model: model,
      instrumental: instrumental,
      customMode: customMode,
      callBackUrl: `${config.baseUrl}/api/audio/suno-callback`, // Required by API, but we use polling
    };

    // In custom mode, add style and title if needed
    if (customMode) {
      console.log(`[GENERATE MUSIC] Processing custom mode parameters...`);
      if (!instrumental && !trimmedPrompt) {
        console.error(`[GENERATE MUSIC] ❌ Prompt is required when customMode is true and instrumental is false`);
        throw new Error('Prompt is required when customMode is true and instrumental is false');
      }
      if (style) {
        const maxStyleLength = model === 'V4' ? 200 : 1000;
        console.log(`[GENERATE MUSIC] Validating style length (max: ${maxStyleLength})...`);
        if (style.trim().length > maxStyleLength) {
          console.error(`[GENERATE MUSIC] ❌ Style too long: ${style.trim().length} > ${maxStyleLength}`);
          throw new Error(`Style is too long. Maximum ${maxStyleLength} characters for ${model}.`);
        }
        requestBody.style = style.trim();
        console.log(`[GENERATE MUSIC] ✓ Style validated: ${style.trim().length} chars`);
      }
      if (title) {
        const maxTitleLength = (model === 'V4' || model === 'V4_5ALL') ? 80 : 100;
        console.log(`[GENERATE MUSIC] Validating title length (max: ${maxTitleLength})...`);
        if (title.trim().length > maxTitleLength) {
          console.error(`[GENERATE MUSIC] ❌ Title too long: ${title.trim().length} > ${maxTitleLength}`);
          throw new Error(`Title is too long. Maximum ${maxTitleLength} characters for ${model}.`);
        }
        requestBody.title = title.trim();
        console.log(`[GENERATE MUSIC] ✓ Title validated: ${title.trim().length} chars`);
      }
    }

    console.log(`[GENERATE MUSIC] Request body:`, JSON.stringify({
      ...requestBody,
      prompt: `${requestBody.prompt.substring(0, 100)}... (${requestBody.prompt.length} chars)`,
    }, null, 2));
    console.log(`[GENERATE MUSIC] Sending POST request to: ${SUNO_API_BASE_URL}/api/v1/generate`);
    
    // Use trimmed API key for the actual request
    const trimmedApiKey = config.sunoApiKey.trim();
    
    const response = await fetch(`${SUNO_API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trimmedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`[GENERATE MUSIC] Response status: ${response.status} ${response.statusText}`);
    console.log(`[GENERATE MUSIC] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error(`[GENERATE MUSIC] ❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[GENERATE MUSIC] Error response body:`, errorText);
      let errorData;
      try {
        errorData = errorText ? JSON.parse(errorText) : { message: response.statusText };
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      console.error(`[GENERATE MUSIC] Parsed error data:`, errorData);
      
      // Special handling for 401 errors
      if (response.status === 401) {
        console.error(`[GENERATE MUSIC] ========================================`);
        console.error(`[GENERATE MUSIC] 🔐 AUTHENTICATION ERROR (401)`);
        console.error(`[GENERATE MUSIC] This usually means:`);
        console.error(`[GENERATE MUSIC] 1. API key is invalid or expired`);
        console.error(`[GENERATE MUSIC] 2. API key doesn't have required permissions`);
        console.error(`[GENERATE MUSIC] 3. API key format is incorrect`);
        console.error(`[GENERATE MUSIC] 4. API key is not activated in your Suno account`);
        console.error(`[GENERATE MUSIC]`);
        console.error(`[GENERATE MUSIC] Troubleshooting steps:`);
        console.error(`[GENERATE MUSIC] - Verify your API key at: https://sunoapi.org/dashboard`);
        console.error(`[GENERATE MUSIC] - Check that the key is active and has credits`);
        console.error(`[GENERATE MUSIC] - Ensure the key is correctly set in your .env file`);
        console.error(`[GENERATE MUSIC] - Make sure there are no extra spaces or quotes in the .env file`);
        console.error(`[GENERATE MUSIC] - API key length: ${trimmedApiKey.length} characters`);
        console.error(`[GENERATE MUSIC] - API key prefix: ${trimmedApiKey.substring(0, 10)}...`);
        console.error(`[GENERATE MUSIC] ========================================`);
      }
      
      throw new Error(errorData.message || errorData.error || `Suno API error: ${response.statusText}`);
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();
    console.log(`[GENERATE MUSIC] Response body length: ${responseText?.length || 0} characters`);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error(`[GENERATE MUSIC] ❌ Empty response from Suno API`);
      throw new Error('Empty response from Suno API');
    }

    let responseData;
    try {
      console.log(`[GENERATE MUSIC] Parsing JSON response...`);
      responseData = JSON.parse(responseText);
      console.log(`[GENERATE MUSIC] ✓ JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[GENERATE MUSIC] ❌ Failed to parse JSON:`, parseError.message);
      console.error(`[GENERATE MUSIC] Raw response (first 500 chars):`, responseText.substring(0, 500));
      throw new Error(`Invalid JSON response from Suno API: ${parseError.message}`);
    }
    
    console.log(`[GENERATE MUSIC] Full response data:`, JSON.stringify(responseData, null, 2));

    // Suno API typically returns: { code: 200, msg: "success", data: { taskId: "..." } }
    // Check for success code first
    console.log(`[GENERATE MUSIC] Checking response code: ${responseData.code || 'NOT FOUND'}`);
    if (responseData.code && responseData.code !== 200) {
      console.error(`[GENERATE MUSIC] ❌ API returned error code: ${responseData.code}`);
      console.error(`[GENERATE MUSIC] Error message: ${responseData.msg || responseData.message}`);
      throw new Error(responseData.msg || responseData.message || `Suno API returned error code: ${responseData.code}`);
    }
    console.log(`[GENERATE MUSIC] ✓ Response code is 200 (success)`);

    // Check for taskId in various possible formats
    // Primary format: data.taskId (nested in data object)
    // Fallback formats: direct taskId, task_id, id, etc.
    console.log(`[GENERATE MUSIC] Extracting task ID from response...`);
    console.log(`[GENERATE MUSIC] - responseData.data?.taskId: ${responseData.data?.taskId || 'NOT FOUND'}`);
    console.log(`[GENERATE MUSIC] - responseData.data?.task_id: ${responseData.data?.task_id || 'NOT FOUND'}`);
    console.log(`[GENERATE MUSIC] - responseData.taskId: ${responseData.taskId || 'NOT FOUND'}`);
    console.log(`[GENERATE MUSIC] - responseData.task_id: ${responseData.task_id || 'NOT FOUND'}`);
    console.log(`[GENERATE MUSIC] - responseData.id: ${responseData.id || 'NOT FOUND'}`);
    
    const taskId = responseData.data?.taskId 
      || responseData.data?.task_id
      || responseData.taskId 
      || responseData.task_id 
      || responseData.id
      || responseData.result?.taskId
      || responseData.result?.task_id
      || (Array.isArray(responseData.data) && responseData.data[0]?.taskId)
      || (Array.isArray(responseData.data) && responseData.data[0]?.task_id)
      || (Array.isArray(responseData) && responseData[0]?.taskId)
      || (Array.isArray(responseData) && responseData[0]?.task_id);
    
    if (!taskId) {
      console.error(`[GENERATE MUSIC] ❌ No task ID found in response!`);
      console.error(`[GENERATE MUSIC] Full response structure:`, JSON.stringify(responseData, null, 2));
      const errorMsg = responseData.msg || responseData.message || 'Unknown error';
      throw new Error(`No task ID received from Suno API. ${errorMsg}. Response: ${JSON.stringify(responseData, null, 2)}`);
    }
    
    console.log(`[GENERATE MUSIC] ✓ Task ID extracted: ${taskId}`);
    console.log(`[GENERATE MUSIC] ⏳ Starting polling (using polling instead of webhook callbacks)...`);

    // Step 2: Poll for completion using polling (not webhooks)
    const result = await pollForCompletion(taskId);
    
    console.log(`[GENERATE MUSIC] ✅ Music generation completed!`);
    console.log(`[GENERATE MUSIC] Received ${result.songs?.length || 1} song(s)`);
    if (result.songs) {
      result.songs.forEach((song, index) => {
        console.log(`[GENERATE MUSIC] Song ${index + 1}: ${song.title || 'Untitled'} - ${song.audio_url || song.stream_audio_url}`);
      });
    } else if (result.audioUrl) {
      console.log(`[GENERATE MUSIC] Audio URL: ${result.audioUrl}`);
    }
    console.log(`[GENERATE MUSIC] ========================================\n`);

    return {
      success: true,
      prompt: prompt,
      taskId: taskId, // Include taskId in response for manual polling
      ...result,
    };
  } catch (error) {
    console.error(`[GENERATE MUSIC] ❌ Error occurred:`, error.message);
    console.error(`[GENERATE MUSIC] Error stack:`, error.stack);
    console.error(`[GENERATE MUSIC] ========================================\n`);
    throw new Error(`Failed to generate music: ${error.message}`);
  }
};

