using OpenTK.Graphics.OpenGL;

namespace Towers;

public class Shader : IDisposable
{
    private bool _disposedValue = false;
    private readonly int _handle;

    public Shader(string vertexPath, string fragmentPath)
    {
        var vertexShader = CreateShader(ShaderType.VertexShader, vertexPath);
        var fragmentShader = CreateShader(ShaderType.FragmentShader, fragmentPath);

        _handle = GL.CreateProgram();
        GL.AttachShader(_handle, vertexShader);
        GL.AttachShader(_handle, fragmentShader);

        GL.LinkProgram(_handle);

        GL.DetachShader(_handle, vertexShader);
        GL.DetachShader(_handle, fragmentShader);
        GL.DeleteShader(fragmentShader);
        GL.DeleteShader(vertexShader);
    }

    public void Use()
    {
        GL.UseProgram(_handle);
    }

    public int GetAttrLocation(string attribute)
    {
        return GL.GetAttribLocation(_handle, attribute);
    }

    private static int CreateShader(ShaderType type, string path)
    {
        var source = File.ReadAllText(path);

        var shader = GL.CreateShader(type);
        GL.ShaderSource(shader, source);

        GL.CompileShader(shader);

        var log = GL.GetShaderInfoLog(shader);
        if (log is { Length: > 0 })
        {
            Console.Write(log);
        }

        return shader;
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            GL.DeleteProgram(_handle);

            _disposedValue = true;
        }
    }

    ~Shader()
    {
        Dispose(false);
    }


    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
}
